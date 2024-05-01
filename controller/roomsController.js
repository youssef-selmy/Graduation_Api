// const {
//     BlobServiceClient,
//     StorageSharedKeyCredential,
//   } = require("@azure/storage-blob");
  const roomsModel = require("../models/roomsModel");
  const userModel = require("../models/userModel");
//   const interestModel = require("../models/channelSchema");
//   const recordingsModel = require("../models/recordingsSchema");
//   var auctionModel = require("../models/auction");
//   const auctionSubscription = require("../models/auctionSubscription");
  
   const functions = require("../utils/functions");
//   require("dotenv").config({ path: ".env" });
  const {
    RtcTokenBuilder,
    RtcRole,
    RtmTokenBuilder,
    RtmRole,
  } = require("agora-access-token");
  const admin = require("firebase-admin");
  
//   var axios = require("axios");
  var mongoose = require("mongoose");
  const arrayToObjectIds = require("../utils/arrayToObjectIds");

//   const { findByIdAndUpdate } = require("../models/orderSchema");
  
  exports.createRoom = async (req, res) => {
    try {
      let newObj = {
        ownerId: mongoose.Types.ObjectId(req.params.userId),
        productIds: arrayToObjectIds(req.body.productIds),
        invitedhostIds: arrayToObjectIds(req.body.hostIds),
        hostIds: arrayToObjectIds([req.params.userId]),
        userIds: arrayToObjectIds(req.body.userIds),
        title: req.body.title,
        raisedHands: arrayToObjectIds(req.body.raisedHands),
        speakerIds: arrayToObjectIds(req.body.speakerIds),
        invitedIds: arrayToObjectIds(req.body.invitedIds),
        // shopId: mongoose.Types.ObjectId(req.body.shopId),
        // productImages: req.body.productImages,
        productPrice: req.body.productPrice,
        discount: req.body.discount,
        event: req.body.event,
        eventDate: req.body.eventDate,
        roomType: req.body.roomType,
        description: req.body.description,
        channel: req.body.channel,
        allowrecording: req.body.allowrecording,
        allowchat: req.body.allowchat,
        activeTime: req.body.activeTime,
      };
  
      let user = await userModel.findById(req.params.userId);
  
      await userModel.findByIdAndUpdate(
        user._id,
        {
          $inc: { tokshows: 1 },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      if (user.currentRoom != "" && user.currentRoom != req.params.roomId) {
        let userRoom = await roomsModel.findById(user.currentRoom);
  
        if (
          userRoom != null &&
          userRoom["ended"] == false &&
          userRoom["event"] != true
        ) {
          if (
            userRoom.hostIds.length < 2 &&
            userRoom.hostIds.includes(req.params.userId)
          ) {
            await roomsModel.findByIdAndUpdate(user.currentRoom, {
              $set: {
                ended: true,
                endedTime: Date.now(),
                productImages: [],
              },
            });
          } else {
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { speakerIds: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { hostIds: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { userIds: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
          }
        }
      }
  
      let newRoom = await roomsModel.create(newObj);
  
      await userModel.findByIdAndUpdate(
        req.params.userId,
        {
          $set: { currentRoom: newRoom._id, muted: true },
        },
        { runValidators: true, new: true, upsert: false }
      );
      let token = await generateRoomToken(newRoom._id);
      console.log(token)
      let newRoomrees = await roomsModel
        .findByIdAndUpdate(
          newRoom._id,
          {
            $set: { token: token },
          },
          { runValidators: true, new: true, upsert: false }
        )
        // .populate("channel")
        // .populate({
        //   path: "channel",
        //   populate: {
        //     path: "interests",
        //   },
        // });
  
    //   if (req.body.channel != null) {
    //     await interestModel.findByIdAndUpdate(newObj.channel, {
    //       $addToSet: { rooms: [newRoom._id] },
    //     });
    //   }
  
      /*
          for (let i = 0; i < user.followers.length; i++) {
            functions.saveActivity(
              newRoom._id,
              user.firstName + " " + user.lastName,
              "RoomScreen",
              false,
              null,
              user.followers[i]._id,
              user.firstName + " " + user.lastName + " started a TokShow. Join?.",
              user._id
            );
          }
      
          for (let i = 0; i < req.body.hostIds.length; i++) {
            functions.saveActivity(
              newRoom._id,
              user.firstName + " " + user.lastName,
              "RoomScreen",
              false,
              null,
              req.body.hostIds[i],
              user.firstName +
                " " +
                user.lastName +
                " has invited you to be a co-host in their TokShow. Join?.",
              user._id
            );
          }
      */
  
      let hostNotificationTokens = [];
  
      for (let i = 0; i < req.body.hostIds.length; i++) {
        if (req.params.userId != req.body.hostIds[i]) {
          var host = await userModel.findOne({ _id: req.body.hostIds[i] });
  
          if (host && host["notificationToken"] != "") {
            hostNotificationTokens.push(host["notificationToken"]);
          }
        }
      }
  
      var userNotificationTokens = [];
  
      if (req.body.roomType != "private") {
        for (let i = 0; i < user.followers.length; i++) {
          if (req.body.hostIds.indexOf(user.followers[i]) < 0) {
            var follower = await userModel.findOne({ _id: user.followers[i] });
  
            if (
              follower != null &&
              follower["notificationToken"] != "" &&
              !hostNotificationTokens.includes(follower["notificationToken"])
            ) {
              userNotificationTokens.push(follower["notificationToken"]);
            }
          }
        }
      }
  
      if (userNotificationTokens.length > 0) {
        functions.sendNotificationOneSignal(
          userNotificationTokens,
          "Join TokShow",
          user.firstName + " " + user.lastName + " started a TokShow. Join?.",
          "RoomScreen",
          newRoom._id
        );
      }
  
      functions.sendNotificationToAll({
        included_segments: ["Subscribed Users"],
        data: { screen: "RoomScreen", id: newRoom._id },
        headings: { en: "Join TokShow" },
        contents: {
          en:
            user.firstName +
            " " +
            user.lastName +
            " started a TokShow. join them?.",
        },
      });
  
      try {
        if (hostNotificationTokens.length > 0) {
          functions.sendNotificationOneSignal(
            hostNotificationTokens,
            "You've been invited",
            user.firstName +
              " " +
              user.lastName +
              " has invited you to be a co-host in their TokShow. Join?.",
            "RoomScreen",
            newRoom._id
          );
        }
      } catch (error) {
        console.log(error + " sending notification");
        res
          .status(422)
          .setHeader("Content-Type", "application/json")
          .json(error.message);
      }
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(newRoomrees);
    } catch (error) {
      console.log(error + "");
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeFeaturedProduct = async (req, res) => {
    try {
      let roomid = req.params.roomid;
      await roomsModel.findByIdAndUpdate(
        roomid,
        {
          $pullAll: req.body,
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      res.json({ success: true });
    } catch (error) {
      console.log(error + " ");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false });
    }
  };
  
  exports.addProducttoRoom = async (req, res) => {
    try {
      let roomid = req.params.roomid;
      let productid = req.body.productid;
      console.log(req.body);
  
      await roomsModel.findByIdAndUpdate(
        roomid,
        {
          $addToSet: req.body,
        },
        { runValidators: true, new: true, upsert: false }
      );
      res.json({ success: true });
    } catch (error) {
      console.log(error + " ");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false });
    }
  };
  
  exports.removeFromCurrentRoom = async (req, res) => {
    try {
      let user = await userModel.findById(req.params.userId);
  
      if (user.currentRoom != "" && user.currentRoom != req.body.newRoomId) {
        let userRoom = await roomsModel.findById(user.currentRoom);
  
        if (
          userRoom != null &&
          userRoom["ended"] == false &&
          userRoom["event"] != true
        ) {
          if (
            userRoom.hostIds.length < 2 &&
            userRoom.hostIds.includes(req.params.userId)
          ) {
            await roomsModel.findByIdAndUpdate(user.currentRoom, {
              $set: {
                ended: true,
                endedTime: Date.now(),
                productImages: [],
              },
            });
  
            if (userRoom.channel != null) {
              await interestModel.updateOne(
                { _id: mongoose.Types.ObjectId(userRoom.channel) },
                {
                  $pullAll: { rooms: [userRoom._id] },
                }
              );
            }
          } else {
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { speakerIds: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { hostIds: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { userIds: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
  
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { raisedHands: [req.params.userId] },
              },
              { runValidators: true, new: true, upsert: false }
            );
          }
        }
      }
  
      await userModel.findByIdAndUpdate(req.params.userId, {
        $set: { currentRoom: req.body.newRoomId, muted: true },
      });
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: true });
    } catch (error) {
      console.log(error + "");
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json({ success: true, message: error });
    }
  };
  
  exports.createEvent = async (req, res) => {
    try {
      let newObj = {
        ownerId: mongoose.Types.ObjectId(req.params.userId),
        productIds: arrayToObjectIds(req.body.productIds),
        invitedhostIds: arrayToObjectIds(req.body.hostIds),
        hostIds: arrayToObjectIds([req.params.userId]),
        userIds: arrayToObjectIds(req.body.userIds),
        title: req.body.title,
        raisedHands: arrayToObjectIds(req.body.raisedHands),
        speakerIds: arrayToObjectIds(req.body.speakerIds),
        invitedIds: arrayToObjectIds(req.body.invitedIds),
        // shopId: mongoose.Types.ObjectId(req.body.shopId),
        // productImages: req.body.productImages,
        productPrice: req.body.productPrice,
        event: req.body.event,
        eventDate: req.body.eventDate,
        roomType: req.body.roomType,
        description: req.body.description,
        channel: req.body.channel,
        allowrecording: req.body.allowrecording,
        allowchat: req.body.allowchat,
        discount: req.body.discount,
      };
      var eventDate = new Date(req.body.eventDate).toLocaleString();
  
      let user = await userModel.findById(req.params.userId);
  
      let newRoom = await roomsModel.create(newObj);
  
      for (let i = 0; i < user.followers.length; i++) {
        functions.saveActivity(
          newRoom._id,
          user.name,
          "RoomScreen",
          false,
          null,
          user.followers[i]._id,
          user.name + " created an event.",
          user._id
        );
      }
  
      functions.sendNotificationToAll({
        included_segments: ["Subscribed Users"],
        data: { screen: "EventScreen", id: newRoom._id },
        headings: { en: "Upcoming TokShow" },
        contents: {
          en: ` ${user.name}  will be live on ${eventDate}, do you want to notified when they are live?.`,
        },
      });
  
      let hostNotificationTokens = [];
  
      for (let i = 0; i < req.body.hostIds.length; i++) {
        if (req.params.userId != req.body.hostIds[i]) {
          var host = await userModel.findOne({ _id: req.body.hostIds[i] });
  
          console.log(host.notificationToken);
  
          if (host["notificationToken"] != "") {
            console.log(host["notificationToken"]);
            hostNotificationTokens.push(host["notificationToken"]);
          }
        }
      }
  
      var userNotificationTokens = [];
  
      if (req.body.roomType != "private") {
        for (let i = 0; i < user.followers.length; i++) {
          if (req.body.hostIds.indexOf(user.followers[i]) < 0) {
            var follower = await userModel.findOne({ _id: user.followers[i] });
  
            if (
              follower["notificationToken"] != "" &&
              !hostNotificationTokens.includes(follower["notificationToken"])
            ) {
              userNotificationTokens.push(follower["notificationToken"]);
            }
          }
        }
      }
  
      if (hostNotificationTokens.length > 0) {
        functions.sendNotificationOneSignal(
          hostNotificationTokens,
          "You've been invited",
          user.name +
            " has invited you to be a co-host in their event.",
          "EventScreen",
          newRoom._id
        );
      }
  
      res.status(200).setHeader("Content-Type", "application/json").json({newRoom});
    } catch (error) {
      console.log(error + "");
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  generateRoomToken = async (channel) => {
    try {
      const uid = 0;
      var channelName = channel;
      const role = RtcRole.PUBLISHER;
      const expirationTimeInSeconds = 84600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
      var response = await functions.getSettings();
      console.log(response["agoraAppID"]);
      const token = RtmTokenBuilder.buildToken(
        "eaa1810d9a4a477d97053548a5ef7819", //app id
        "dfa7fcd91d5c47058bbacd8f21701b3a",//app cer
        channelName + "",
        RtmRole,
        privilegeExpiredTs
      );
      return token;
    } catch (error) {
      console.log("error", error);
      return null;
    }
  };
  
  exports.generateagoratoken = async (req, res) => {
    try {
      const uid = 0;
      const role = RtcRole.PUBLISHER;
      const expirationTimeInSeconds = 84600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
      // var response = await functions.getSettings();
      // console.log(response);
      const token = RtmTokenBuilder.buildToken(
        "eaa1810d9a4a477d97053548a5ef7819", //app id
        "dfa7fcd91d5c47058bbacd8f21701b3a",//app cer
        req.body.channel,
        RtmRole,
        privilegeExpiredTs
      );
      console.log(token);
      res.json({ token });
    } catch (error) {
      console.log("error ", error);
      res.status(500).send(error);
    }
  };
  exports.generateRtmToken = async (req, res) => {
    try {
      // get uid
      let uid = req.params.id;
      if (!uid || uid === "") {
        return res.status(500).json({ error: "uid is required" });
      }
      // get role
      let role = RtmRole.Rtm_User;
      const expirationTimeInSeconds = 84600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
      // var response = await functions.getSettings();
      const token = RtmTokenBuilder.buildToken(
        "eaa1810d9a4a477d97053548a5ef7819", 
        "dfa7fcd91d5c47058bbacd8f21701b3a",
        uid,
        role,
        privilegeExpiredTs
      );
      res.json({ token });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };
  
  //to be removed after updating with shops removed
  exports.getAllTokshows = async (req, res) => {
    try {
      const { title, page, limit } = req.query;
  
      const queryObject = {};
  
      if (title) {
        queryObject.$or = [{ title: { $regex: `${title}`, $options: "i" } }];
      }
  
      const pages = Number(page);
      const limits = Number(limit);
      const skip = (pages - 1) * limits;
  
      try {
        const totalDoc = await roomsModel.countDocuments(queryObject);
        const rooms = await roomsModel
          .find(queryObject)
          .sort({ createdAt: -1 })
  
          .populate("hostIds", [
            "firstName",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
        //   .populate("channel")
          .populate("userIds", [
            "firstName",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
          .populate("raisedHands", [
            "firstName",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
            "muted",
          ])
          .populate("speakerIds", [
            "firstName",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
          .populate("invitedIds", [
            "firstName",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
          .populate({
            path: "productIds",
            populate: {
              path: "ownerId",
  
            //   populate: {
            //     path: "shopId",
            //   },
            },
          })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       populate: {
        //         path: "shopId",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "bids",
        //       populate: {
        //         path: "user",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "winner",
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       path: "winning",
        //       path: "bids",
        //       populate: {
        //         path: "shopId",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "productIds",
        //     populate: {
        //       path: "interest",
        //     },
        //   })
          .populate({
            path: "productIds",
            populate: {
              path: "reviews",
            },
          })
        //   .populate("shopId", ["description", "image"])
          .populate("ownerId", [
            "firstName",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
          .skip(skip)
          .limit(limits);
  
        res.send({
          rooms,
          totalDoc,
          limits,
          pages,
        });
      } catch (err) {
        res.status(500).send({
          message: err.message,
        });
      }
    } catch (error) {
      console.log(error + " ");
      res.statusCode = 422;
      res.setHeader("Content-Type", "application/json");
      res.json(error);
    }
  };
  
  exports.getRoomsByUserId = async (req, res) => {
    try {
      let rooms = await roomsModel
        .find({
          $or: [
            {
              roomType: "public",
              event: false,
              ended: false,
            },
            {
              $and: [
                { roomType: "private" },
                {
                  $or: [
                    { invitedhostIds: req.params.userId },
                    { invitedIds: req.params.userId },
                  ],
                },
  
                { event: false, ended: false },
              ],
            },
          ],
        })
        .sort({ createdAt: -1 })
        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
          "muted",
        ])
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "bids",
        //     populate: {
        //       path: "user",
        //     },
        //   },
        // })
        // .populate("channel")
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "winner",
        //   },
        // })
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",
  
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "product",
  
        //     populate: {
        //       path: "shopId",
        //     },
        //   },
        // })
        .populate({
          path: "pin",
          populate: {
            path: "ownerId",
  
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
        })
        // .populate({
        //   path: "productIds",
        //   populate: {
        //     path: "interest",
        //   },
        // })
        // .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ]);
      res.status(200).setHeader("Content-Type", "application/json").json(rooms);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.getActiveTokshows = async (req, res) => {
    try {
      const { title, page, limit, userid, channel, event } = req.query;
  
      const queryObject = {};
  
      if (title) {
        queryObject.$or = [{ title: { $regex: `${title}`, $options: "i" } }];
      }
      if (userid) {
        queryObject.$and = [{ ownerId: { $eq: userid } }];
      }
      if (channel) {
        queryObject.$and = [{ channel: { $eq: channel } }];
      }
  
      queryObject.$or = [
        {
       //   roomType: "public",
          event: event ?? false,
          ended: false,
        },
      ];
  
      const pages = Number(page);
      const limits = Number(limit);
      const skip = (pages - 1) * limits;
  
      try {
        const totalDoc = await roomsModel.countDocuments(queryObject);
        const rooms = await roomsModel
          .find(queryObject)
          .sort({ createdAt: -1 })
  
          .populate("hostIds", [
            "name",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
          .populate("userIds", [
            "name",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
        //   .populate("channel")
          .populate("raisedHands", [
            "name",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
            "muted",
          ])
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "bids",
        //       populate: {
        //         path: "user",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "channel",
        //     populate: {
        //       path: "interests",
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "winner",
        //     },
        //   })
          .populate("speakerIds", [
            "name",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
          .populate("invitedIds", [
            "name",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
          ])
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       populate: {
        //         path: "shopId",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       populate: {
        //         path: "interest",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       populate: {
        //         path: "reviews",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "bids",
        //       populate: {
        //         path: "user",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       populate: {
        //         path: "ownerId",
        //       },
        //     },
        //   })
        //   .populate({
        //     path: "activeauction",
        //     populate: {
        //       path: "product",
        //       path: "winner",
        //       path: "winning",
        //       path: "bids",
        //       populate: {
        //         path: "shopId",
        //       },
        //     },
        //   })
  
          .populate({
            path: "pin",
            populate: {
              path: "ownerId",
  
            //   populate: {
            //     path: "shopId",
            //   },
            },
          })
          .populate({
            path: "productIds",
            populate: {
              path: "ownerId",
  
            //   populate: {
            //     path: "shopId",
            //   },
            },
          })
        //   .populate({
        //     path: "productIds",
        //     populate: {
        //       path: "interest",
        //     },
        //   })
          .populate({
            path: "productIds",
            populate: {
              path: "reviews",
            },
          })
        //   .populate("shopId", ["description", "image"])
          .populate("ownerId", [
            "name",
            "lastName",
            "bio",
            "userName",
            "email",
            "profilePhoto",
            "roomuid",
            "agorauid",
            "followers",
          ])
          .skip(skip)
          .limit(limits);
  
        res.send({
          rooms,
          totalDoc,
          limits,
          pages,
        });
      } catch (err) {
        res.status(500).send({
          message: err.message,
        });
      }
    } catch (error) {
      console.log(error + " ");
      res.statusCode = 422;
      res.setHeader("Content-Type", "application/json");
      res.json(error);
    }
  };
  
  exports.getMyEvents = async (req, res) => {
    console.log(Date.now());
  
    try {
      let rooms = await roomsModel
        .find({
          $and: [
            { event: { $eq: true } },
            { ownerId: { $eq: req.params.userId } },
            { eventDate: { $gte: Date.now() * 1 } },
            { ended: false },
          ],
        })
        .sort({ eventDate: 1 })
        .populate("hostIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
        ])
        .populate("invitedhostIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
        ])
        .populate("userIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
        ])
        .populate("raisedHands", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "muted",
        ])
        .populate("speakerIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
        ])
        .populate("invitedIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
        ])
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
        })
        .populate({
          path: "productIds",
          // populate: {
          //   path: "interest",
          // },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",
  
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        // .populate("channel", ["title", "description", "imageurl"])
        // .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
        ]);
      res.status(200).setHeader("Content-Type", "application/json").json(rooms);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.sendRoomNotifications = async (req, res) => {
   
    if (req.body.type == "speaking") {
        let room = await roomsModel.findById(req.body.roomId)
        let roomUsers=room.allUsers;
        // Send notifications to all users in the room
        roomUsers.forEach((user) => {
            if (user.notificationToken) {
                functions.sendNotificationOneSignal(
                    [user.notificationToken],
                    "Live Update!",
                    `${req.body.user.name} is live in the room, discussing ${req.body.room.productIds[0].name}. Join now!`,
                    "RoomScreen",
                    req.body.room._id
                );
            }
        });

        let respnse = await roomsModel
            .findByIdAndUpdate(
                req.body.room._id,
                {
                    $set: { speakersSentNotifications: [req.body.user._id] },
                },
                { new: true, runValidators: true }
            )
            .populate("hostIds", ["name", "email"])
            .populate("userIds", [
                "name",
                "lastName",
                "bio",
                "userName",
                "email",
                "profilePhoto",
                "followersCount",
                "followingCount",
                "followers",
                "following",
            ])
            .populate("raisedHands", [
                "name",
                "lastName",
                "bio",
                "userName",
                "email",
                "profilePhoto",
                "muted",
            ])
            .populate("speakerIds", [
                "name",
                "lastName",
                "bio",
                "userName",
                "email",
                "profilePhoto",
                "followersCount",
                "followingCount",
                "followers",
                "following",
            ])
            .populate("invitedIds", [
                "name",
                "lastName",
                "bio",
                "userName",
                "email",
                "profilePhoto",
            ])
            .populate({
                path: "productIds",

                populate: {
                    path: "ownerId",

                    populate: {
                        path: "shopId",
                    },
                },
            })
            .populate("shopId", ["description", "image"])
            .populate("ownerId", [
                "name",
                "lastName",
                "bio",
                "userName",
                "email",
                "profilePhoto",
                "agorauid",
                "roomuid",
            ]);
        res.status(200).setHeader("Content-Type", "application/json").json(respnse);
    }
};

  
  exports.updateRoomById = async (req, res) => {
    try {
      console.log(req.body);
      let updatedRoom = await roomsModel
        .findByIdAndUpdate(
          req.params.roomId,
          {
            $set: req.body,
          },
          { new: true, runValidators: true }
        )
        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "bids",
        //     populate: {
        //       path: "user",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "winner",
        //   },
        // })
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
          "muted",
        ])
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate({
          path: "productIds",
  
          populate: {
            path: "ownerId",
  
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        // .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ]);
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      console.log(error + " ");
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeProductFromroom = async (req, res) => {
    console.log("removeProductFromroom");
    try {
      await roomsModel.findByIdAndUpdate(
        req.params.roomid,
        {
          $pullAll: { productIds: [req.body.product] },
        },
        { runValidators: true, new: true, upsert: false }
      );
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: true });
    } catch (error) {
      console.log(error + " ");
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.addUserToRoom = async (req, res) => {
    try {
      console.log(req.body);
      const room = await roomsModel.findById(req.params.roomId);
  
      let user = await userModel.findById(req.body.users[0]);
  
      if (user.currentRoom != "" && user.currentRoom != req.params.roomId) {
        let userRoom = await roomsModel.findById(user.currentRoom);
  
        if (userRoom != null && userRoom["ended"] == false) {
          console.log("1");
          if (
            userRoom.hostIds.length < 2 &&
            userRoom.hostIds.includes(req.body.users[0])
          ) {
            await roomsModel.findByIdAndUpdate(user.currentRoom, {
              $set: {
                ended: true,
                endedTime: Date.now(),
                productImages: [],
              },
            });
          } else {
            console.log("2");
            await roomsModel.findByIdAndUpdate(
              user.currentRoom,
              {
                $pullAll: { userIds: [req.body.users] },
                $pullAll: { hostIds: [req.body.users] },
                $pullAll: { speakerIds: [req.body.users] },
              },
              { runValidators: true, new: true, upsert: false }
            );
          }
        }
      }
      await userModel.findByIdAndUpdate(req.body.users[0], {
        $set: { currentRoom: req.params.roomId, muted: true },
      });
  
      if (
        room.hostIds.includes(req.body.users[0]) ||
        room.speakerIds.includes(req.body.users[0])
      ) {
        console.log("3");
        res.status(200).setHeader("Content-Type", "application/json").json(room);
      } else {
        console.log("4");
        let updatedRoom = await roomsModel.findByIdAndUpdate(
          req.params.roomId,
          {
            $addToSet: { userIds: req.body.users },
            $set: { allUsers: req.body.users },
          },
          { runValidators: true, new: true, upsert: false }
        );
        res
          .status(200)
          .setHeader("Content-Type", "application/json")
          .json(updatedRoom);
      }
    } catch (error) {
      console.log(error.message);
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeUserFromRoom = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { userIds: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { allUsers: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      if (req.body.speakerIds) {
        await roomsModel.findByIdAndUpdate(
          req.params.roomId,
          {
            $pullAll: { allUsers: req.body.speakerIds },
          },
          { runValidators: true, new: true, upsert: false }
        );
      }
      if (req.body.raisedHands) {
        await roomsModel.findByIdAndUpdate(
          req.params.roomId,
          {
            $pullAll: { allUsers: req.body.raisedHands },
          },
          { runValidators: true, new: true, upsert: false }
        );
      }
      await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { invitedSpeakerIds: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await userModel.findByIdAndUpdate(req.body.users[0], {
        $set: { currentRoom: "", muted: true },
      });
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeUserFromAudienceRoom = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { userIds: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { allUsers: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await userModel.findByIdAndUpdate(req.body.users[0], {
        $set: { currentRoom: "" },
      });
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeSpeakerRoom = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { speakerIds: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { allUsers: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeInvitedSpeakerRoom = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { invitedSpeakerIds: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { allUsers: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeHostRoom = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { hostIds: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { allUsers: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.removeRaisedHandRoom = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $pullAll: { raisedHands: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.getEventById = async (req, res) => {
    try {
      let room = await roomsModel
        .findById(req.params.roomId)
        .populate("hostIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("userIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedhostIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("raisedHands", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
          "muted",
        ])
        .populate("speakerIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        // .populate("channel", ["title", "description", "imageurl"])
        .populate({
          path: "productIds",
  
          populate: {
            path: "reviews",
          },
        })
        .populate({
          path: "productIds",
  
          populate: {
            path: "ownerId",
  
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        // .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "name",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
          "followers",
        ]);
      res.status(200).setHeader("Content-Type", "application/json").json(room);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.getRoomById = async (req, res) => {
    try {
      let room = await roomsModel
        .findById(req.params.roomId)
        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
          "muted",
        ])
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
          "muted",
        ])
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
          "muted",
        ])
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "bids",
        //     populate: {
        //       path: "user",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "winner",
        //   },
        // })
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
          "muted",
        ])
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "product",
        //     populate: {
        //       path: "shopId",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "product",
        //     populate: {
        //       path: "ownerId",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "product",
        //     populate: {
        //       path: "reviews",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "bids",
        //     populate: {
        //       path: "user",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "winner",
        //     path: "winning",
        //     path: "bids",
        //     populate: {
        //       path: "shopId",
        //     },
        //   },
        // })
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
          "muted",
        ])
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "product",
        //     populate: {
        //       path: "interest",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "bids",
        //     populate: {
        //       path: "user",
        //     },
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "winner",
        //   },
        // })
        // .populate({
        //   path: "activeauction",
        //   populate: {
        //     path: "ownerId",
  
        //     populate: {
        //       path: "shopId",
        //     },
        //   },
        // })
        .populate({
          path: "pin",
          populate: {
            path: "ownerId",
            populate: {
              path: "shopId",
            },
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
        })
        // .populate({
        //   path: "productIds",
        //   populate: {
        //     path: "interest",
        //   },
        // })
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",
  
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        // .populate("shopId")
        // .populate({
        //   path: "ownerId",
        //   populate: {
        //     path: "address",
        //   },
        // })
        // .populate("channel")
        // .populate({
        //   path: "channel",
        //   populate: {
        //     path: "interests",
        //   },
        // });
  
      res.status(200).setHeader("Content-Type", "application/json").json(room);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.getDeletedRoomById = async (req, res) => {
    try {
      let room = await roomsModel
        .findById(req.params.roomId)
        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate({
          path: "activeauction",
          populate: {
            path: "bids",
            populate: {
              path: "user",
            },
          },
        })
        .populate({
          path: "activeauction",
          populate: {
            path: "winner",
          },
        })
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate({
          path: "productIds",
  
          populate: {
            path: "ownerId",
  
            populate: {
              path: "shopId",
            },
          },
        })
        .populate("shopId")
        .populate("ownerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ]);
  
      if (room == null) {
        res.status(200).setHeader("Content-Type", "application/json").json(null);
      } else {
        if (room["ended"] == false) {
          res
            .status(200)
            .setHeader("Content-Type", "application/json")
            .json(null);
        } else {
          res
            .status(200)
            .setHeader("Content-Type", "application/json")
            .json(room);
        }
      }
    } catch (error) {
      console.log(error);
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  
  exports.updateSubMinutes = async (req, res, next) => {
    try {
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(req.body.endTime);
  
     
  
      const durationInSeconds = (endTime - startTime) / 1000;
  
      const allSubscriptions = await auctionSubscription
        .find({ userId: req.body.userId })
        .sort({ createdAt: -1 });
  
      if (allSubscriptions.length === 0) {
        return res.status(422).json({
          status: "No subscriptions found for the user",
        });
      }
  
      const lastSubscription = allSubscriptions[0];
      const usedMinutes = durationInSeconds / 60;
  
      if (usedMinutes > lastSubscription.numberOfMinutes) {
        return res.status(422).json({
          status: "You need more minutes in your package",
        });
      }
  
      const updatedUsedMinutes = await auctionSubscription.findByIdAndUpdate(
        lastSubscription.id,
        { $inc: { usedMinutes: usedMinutes,numberOfMinutes:-usedMinutes } },
        { new: true }
      );
  
      res.status(200).json({
        status: "success",
        updatedSubscription: updatedUsedMinutes,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };
  
  //update video minutes
  exports.updateSubMinutesForVideo = async (req, res, next) => {
    try {
      const durationInSeconds = req.body.videoDuration;
      const userId = req.body.userId;
  
  
      // Retrieve subscriptions
      const allSubscriptions = await auctionSubscription
        .find({ userId })
        .sort({ createdAt: -1 });
  
      if (allSubscriptions.length === 0) {
        return res.status(422).json({
          status: "No subscriptions found for the user",
        });
      }
  
      const lastSubscription = allSubscriptions[0];
      const usedMinutes = durationInSeconds / 60;
  
      if (usedMinutes > lastSubscription.numberOfMinutes) {
        return res.status(422).json({
          status: "You need more minutes in your package",
        });
      }
  
      const updatedUsedMinutes = await auctionSubscription.findByIdAndUpdate(
        lastSubscription.id,
        { $inc: { usedMinutes: usedMinutes,numberOfMinutes:-usedMinutes } },
        { new: true }
      );
  
      res.status(200).json({
        status: "success",
        updatedSubscription: updatedUsedMinutes,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };
  
  
  /*
   startRecording = async (resourceId, channelName, idsToUse) => {
          let startDateTime = Date.now();
          console.log("Total ID USER MAP Time = " + (Date.now() - startDateTime) / 1000);
          try {
              const request = {
                  uid: '999',
                  cname: `${channelName}`,
                  clientRequest: {
                      token: EventService.getRecordingToken(channelName),//tocken of 999
                      recordingConfig: {
                          maxIdleTime: 120,
                          streamTypes: 2,
                          channelType: 0,
                          videoStreamType: 0,
                          subscribeVideoUids: [idsToUse.uId + ""],
                          subscribeAudioUids: [idsToUse.uId + ""],
                          subscribeUidGroup: 0
                      },
                      recordingFileConfig: {
                          avFileType: ["hls"]
                      },
                      storageConfig: {
                          accessKey: "ACCESS KEY",
                          region: 0,//The region parameter has no effect, whether or not it is set.(Ref:https://docs.agora.io/en/cloud-recording/cloud_recording_api_rest?platform=RESTful)
                          bucket: `azure-recordings/${channelName}`,
                          secretKey: "SECRET KEY",
                          vendor: 5
                      }
                  }
              };
              console.log("agoraApiCallConfig", agoraApiCallConfig);
              console.log("req", request);
              const requestUrl = `${AgoraBaseUrl}/v1/apps/${AgoraAppID}/cloud_recording/resourceid/${resourceId}/mode/individual/start`;
              const start = Date.now();
              console.log("req--", requestUrl);
              const response = await axios.post(requestUrl, request, agoraApiCallConfig);
  
              const stop = Date.now();
              const elapsed = stop - start;
  
              //console.log("Total Start Recording Time = " + elapsed / 1000);
              console.log("response.data", response.data);
              if (response.status == 200 || response.status == 201) {
                  return response.data;
              }
              log(response.data, "error");
              throw Error("Recording starting failed with status code: " + response.status);
          } catch (e) {
              appInsightLogHelper.trackException(e, 4);
              throw e;
          }
      };
  */
  
  
  exports.deleteRoomById = async (req, res) => {
    try {
      let updatedRoom = await roomsModel.findByIdAndUpdate(req.params.roomId, {
        $set: {
          ended: true,
          endedTime: Date.now(),
        },
      });
  
      if (updatedRoom.channel != null) {
        await interestModel.updateOne(
          { _id: mongoose.Types.ObjectId(updatedRoom.channel) },
          {
            $pullAll: { rooms: [req.params.roomId] },
          }
        );
      }
  
      if (updatedRoom.activeauction) {
        await auctionModel.findByIdAndUpdate(updatedRoom._id, {
          $set: {
            ended: true,
          },
        });
      }
  
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    } catch (error) {
      console.log("Error deleting room " + error);
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  
  exports.getAllEvents = async (req, res) => {
    try {
      console.log(Date.now() * 1)
      let rooms = await roomsModel
        .find({
          $and: [
        //    { event: { $eq: true } },
            { eventDate: { $gte: Date.now() * 1 } },
            { ended: false },
          ],
        })
        .sort({ eventDate: 1 })
        .populate("hostIds", [
          "name",
          
          "email",
          "profilePhoto",
        ])
        .populate("invitedhostIds", [
          "name",
          
          "email",
          "profilePhoto",
        ])
        .populate("userIds", [
          "name",
          
          "email",
          "profilePhoto",
        ])
        .populate("raisedHands", [
          "name",
          "email",
          "profilePhoto",
        ])
        .populate("speakerIds", [
          "name",
          "email",
          "profilePhoto",
        ])
        .populate("invitedIds", [
          "name",
          "email",
          "profilePhoto",
        ])
        .populate({
          path: "productIds",
          // populate: {
          //   path: "interest",
          // },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",
            // populate: {
            //   path: "shopId",
            // },
          },
        })
        // .populate("channel", ["title", "description", "imageurl"])
        // .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "name",
          "email",
          "profilePhoto",
          "followers",
        ]);
      res.status(200).setHeader("Content-Type", "application/json").json(rooms);
    } catch (error) {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json(error.message);
    }
  };
  