import { Provider } from "./provider.js";
import express from "express";
import { authenticate, isAuthenticated } from "./auth.js";


var app = express();
const port = 8001;
var provider = null


app.get("/", async (req, res) => {
    const {status, redirect, token, payload} = await authenticate(req, res)

    if (redirect) {
        return res.redirect(redirect)
    }

    if (status === false) {
        console.error(`Authentication failed ${payload}`)
        return res.send("Provider authentication failed")
    }

    console.log({token})
    if (provider == null) {
        provider = new Provider({token})
    }
    res.send("Provider authenticated.");
})

app.listen(port)
console.log(`listening on http://localhost:${port}`)

