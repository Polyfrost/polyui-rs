use crate::{
    stages,
    templates::{messages, pages},
};

use std::{collections::HashMap, sync::Arc};
use trillium::{conn_try, Conn, Status};
use trillium_askama::{AskamaConnExt, Template};
use trillium_client as c;
use uuid::Uuid;

macro_rules! ws_conn_try {
    ($ctx:literal $status:path, $res:expr => $conn:expr, $ws_conn:expr) => {
        match $res {
            Ok(res) => res,
            Err(err) => {
                let error = format!("In {}: {err}", $ctx);
                let render = messages::Error::render(&error);
                $ws_conn.send_string(render.clone()).await;
                trillium::log_error!($ws_conn.close().await);
                return pages::Error {
                    code: $status,
                    message: &render,
                }
                .render($conn);
            }
        }
    };
}

#[allow(clippy::too_many_lines)]
pub async fn route(conn: Conn) -> Conn {
    let params = url::form_urlencoded::parse(conn.querystring().as_bytes())
        .collect::<HashMap<_, _>>();
    let client = c::Client::<crate::Connector>::new().with_default_pool();
    let state = conn
        .state::<Arc<crate::db::RuntimeState>>()
        .unwrap()
        .clone();
    let config = conn.state::<Arc<crate::config::Config>>().unwrap().clone();

    let code = conn_try!(
        params
            .get("code")
            .ok_or(eyre::eyre!("No access code received")),
        conn
    );

    let conn_id = match params.get("state") {
        Some(id) => id.clone().into_owned(),
        None => {
            return pages::Error {
                code: Status::BadRequest,
                message:
                    "No state sent, you probably are using the wrong route",
            }
            .render(conn);
        }
    };
    let mut ws_conn = match Uuid::try_parse(&conn_id)
        .ok()
        .and_then(|it| state.auth_sockets.get_mut(&it))
    {
        Some(id) => id,
        None => return pages::Error {
            code: Status::BadRequest,
            message:
                "Invalid state sent, you probably need to get a new websocket",
        }
        .render(conn),
    };
    let ws_conn = ws_conn.value_mut();

    log::info!("Signing in with code {code}");
    let access_token = ws_conn_try!(
        "OAuth token exchange" Status::InternalServerError,
        stages::access_token::fetch_token(
            &client,
            &config.public_url,
            code,
            &config.client_id,
            &config.client_secret,
        ).await
        => conn, ws_conn
    );

    let stages::xbl_signin::XBLLogin {
        token: xbl_token,
        uhs,
    } = ws_conn_try!(
        "XBox Live token exchange" Status::InternalServerError,
        stages::xbl_signin::login_xbl(&client, &access_token.access_token).await
        => conn, ws_conn
    );

    let xsts_response = ws_conn_try!(
        "XSTS token exchange" Status::InternalServerError,
        stages::xsts_token::fetch_token(&client, &xbl_token).await
        => conn, ws_conn
    );

    match xsts_response {
        stages::xsts_token::XSTSResponse::Unauthorized(err) => {
            ws_conn
                .send_string(messages::Error::render(&format!(
                    "Error getting XBox Live token: {err}"
                )))
                .await;
            trillium::log_error!(ws_conn.close().await);

            pages::Error {
                code: Status::Forbidden,
                message: &err,
            }
            .render(conn)
        }
        stages::xsts_token::XSTSResponse::Success { token: xsts_token } => {
            let bearer_token = &ws_conn_try!(
                "Bearer token flow" Status::InternalServerError,
                stages::bearer_token::fetch_bearer(&client, &xsts_token, &uhs)
                    .await
                => conn, ws_conn
            );
            log::info!("Signin for code {code} successful");
            ws_conn
                .send_string(
                    messages::BearerToken {
                        bearer_token,
                        refresh_token: &access_token.refresh_token,
                    }
                    .render()
                    .unwrap(),
                )
                .await;
            trillium::log_error!(ws_conn.close().await);

            let player_info =
                stages::player_info::fetch_info(&client, bearer_token)
                    .await
                    .unwrap_or_default();

            conn.render(pages::Success {
                name: &player_info.name,
            })
        }
    }
}