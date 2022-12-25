use crate::handler::Request;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct MSADeviceVerifingRequest;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct MSADeviceVerifingResponse {
	device_code: String,
	user_code: String,
	verification_uri: String,
	expires_in: i32,
	interval: i32,
	message: String,
}

impl MSADeviceVerifingResponse {
	pub fn device_code(&self) -> &str {
		&self.device_code
	}

	pub fn user_code(&self) -> &str {
		&self.user_code
	}

	pub fn expires_in(&self) -> i32 {
		self.expires_in
	}

	pub fn interval(&self) -> i32 {
		self.interval
	}

	pub fn verification_uri(&self) -> &str {
		&self.verification_uri
	}
}

#[async_trait::async_trait]
impl Request for MSADeviceVerifingRequest {
	type Client = reqwest::Client;
	type Response = reqwest::Response;
	type Rejection = VerifingRequestRejection;

	async fn request(self, client: &Self::Client) -> Result<Self::Response, Self::Rejection> {
		let url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode"
			.parse::<url::Url>()
			.map_err(VerifingRequestRejection::UrlParse)?;
		let res = client
			.post(url)
			.form(&[
				("client_id", ""),
				("scope", "XboxLive.signin offline_access"),
			])
			.send()
			.await
			.map_err(VerifingRequestRejection::FormSending)?;
		Ok(res)
	}
}

#[derive(Debug, thiserror::Error)]
pub enum VerifingRequestRejection {
	#[error("failed url parse. {0}")]
	UrlParse(#[from] url::ParseError),
	#[error("failed request sending. {0}")]
	FormSending(#[from] reqwest::Error),
}
