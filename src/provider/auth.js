import axios from "axios";
import { response } from "express";

const userPoolId = process.env.COGNITO_POOL_ID;
const clientId = process.env.COGNITO_APP_CLIENT_ID;
const region = process.env.COGNITO_REGION;
const redirectUri = process.env.COGNITO_REDIRECT_URI;
const serverUrl = process.env.BACKEND_URL
const cognitoDomain = `${userPoolId}.auth.${region}.amazoncognito.com`
const cognitoHostedUI = `https://${cognitoDomain}/login?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;

const authenticationStatus = {token: null}

const authenticate = async (req,res) => {
    if (await isAuthenticated()) {
        return {
            status: true,
            token: authenticationStatus.token
        }
    }
    const { code } = req.query;
    if (!code) {
        return {
            status: false,
            redirect: cognitoHostedUI,
            token: null
        };
    }
    let resp
    try {
        resp = await axios.get(serverUrl, {params: {code, provider: redirectUri}})
    }
    catch (error) {
        console.error("Provider: Something went wrong")
        return {
            status: false,
            token: null,

        }
    }

    authenticationStatus.token = resp.headers["set-cookie"]

    if (resp.status != 200) {
        return {
            status: false,
            token: token,
            payload: resp.data
        }
    }

    return {
        status: true,
        token: authenticationStatus.token,
        payload: resp
    }
}

async function checkTokenValid() {
    try {
        (await axios.get(serverUrl, {withCredentials: true, maxRedirects: 0})).status === 200
    } catch {
        return false
    }
}

const isAuthenticated = async () => {
    return authenticationStatus.token != null && await checkTokenValid();
}

export {
    authenticate,
    isAuthenticated
}