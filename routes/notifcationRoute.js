const express = require("express");
const notificationRouter = express.Router();
const userModel = require("../models/userModel");
const functions = require("../utils/functions")


notificationRouter.route("/").post(async (req, res) => {

    try {

        var userNotificationTokens = []

        for (let i = 0; i < req.body.users.length; i++) {
            var user = await userModel.findOne({ _id: req.body.users[i] })
//             console.log(user)

            if (user != null && user.notificationToken != ""){
                userNotificationTokens.push(user["notificationToken"])
//                 console.log(user["notificationToken"])
            }
            
        }

//         console.log("Number of nots to be sent " + userNotificationTokens.length)

        if (userNotificationTokens.length > 0) {
            functions.sendNotificationOneSignal(userNotificationTokens, req.body.title, req.body.message, req.body.screen, req.body.id)
        }

        res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({"Success": true});


    } catch (e) {
        console.log("Error sending notification " + e);
        res
        .status(400)
        .setHeader("Content-Type", "application/json")
        .json({"Success": false});
    }



});


module.exports = notificationRouter;