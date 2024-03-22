import pkg from '@aws-sdk/client-cognito-identity-provider';
const { CognitoIdentityProvider: CognitoIdentityServiceProvider, CognitoIdentityProviderClient } = pkg;
import axios from "axios";
import { decode } from 'jsonwebtoken';

const userPoolId = process.env.COGNITO_POOL_ID;
const clientId = process.env.COGNITO_APP_CLIENT_ID;
const region = process.env.COGNITO_REGION;
const redirectUri = process.env.COGNITO_REDIRECT_URI;

const cognitoDomain = `${userPoolId}.auth.${region}.amazoncognito.com`
const cognitoHostedUI = `https://${cognitoDomain}/login?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
const cognitoTokenEndpoint = `https://${cognitoDomain}/oauth2/token`

const getTokens = async ({ code, provider }) => {
    const params = {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: provider ?? redirectUri,
        code
    };

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await axios.post(
        cognitoTokenEndpoint,
        new URLSearchParams(params),
        { headers, }
    );

    return response.data
}

const authenticateCode = async ({ req, code, provider }) => {
    // Check if the request has an authorization code
    const data = await getTokens({ code, provider });

    // Set the tokens in a secure session or cookie
    req.session.accessToken = data.access_token;
    req.session.refreshToken = data.refresh_token;

}


const authMiddleware = async (req, res, next) => {
    if (!req.session.accessToken) {
        try {
            const { code, provider} = req.query;
            if (!code) {
                // No authorization code, redirect to the Cognito Hosted UI
                return res.status(302).redirect(cognitoHostedUI);
            }
            await authenticateCode({req, code, provider});
        } catch (err) {
            console.error('Error authenticating:', err);
            return res.status(500).json({ error: 'Failed to authenticate' });
        }
    }    
    next()
};
const socketIOAuthMiddleware = (socket, next) => {
    const session = socket.request.session;

    if (!session || !session.accessToken) {
        // No session or access token, reject the connection
        return next(new Error('Authentication error'));
    }

    // Proceed to the next middleware or establish the connection
    next();
};

const getUserUID = (socket) => {
    const decodedToken = decode(socket.request.session.accessToken);
    return decodedToken['sub']
}

export {
    authMiddleware,
    socketIOAuthMiddleware,
    getUserUID
}