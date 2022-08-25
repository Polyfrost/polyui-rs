/**
 * @module AuthManager
 */

import { RestResponseStatus } from '@polyfrost/core/common';
import { MojangRestAPI, mojangErrorDisplayable, MojangErrorCode } from '@polyfrost/core/mojang';
import { MicrosoftAuth, microsoftErrorDisplayable, MicrosoftErrorCode } from '@polyfrost/core/microsoft';
import { AZURE_CLIENT_ID } from './Constants';
import * as ConfigManager from '../core/ConfigManager';
