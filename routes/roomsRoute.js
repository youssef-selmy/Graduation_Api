const express = require("express");
const multer = require("multer");
const roomController = require("../controller/roomsController");

const roomRouter = express.Router();
// const roomsModel = require("../models/roomsModel");



const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
};

let upload = multer({ storage, fileFilter });

roomRouter
  .route("/rooms/roomnotifications")
  .post(roomController.sendRoomNotifications);
roomRouter
  .route("/removecurrentroom/:userId")
  .put(roomController.removeFromCurrentRoom);

roomRouter
  .route("/:userId")
  .post(roomController.createRoom);


roomRouter
  .route("/:roomId")
  .get(roomController.getRoomById)
  .put(roomController.updateRoomById)
  .delete(roomController.deleteRoomById);

roomRouter.route("/ended/:roomId").get(roomController.getDeletedRoomById);

// roomRouter.route("/stoprecording/:sid").post(roomController.stopRecording);     //to do

roomRouter.route("/update-subscription-minutes").patch(roomController.updateSubMinutes)   //to do 

roomRouter.route("/updateVideo-subscription-minutes").patch(roomController.updateSubMinutesForVideo)  //to do

// roomRouter.route("/record/:channelname").post(roomController.recordRoom);   //to do

roomRouter.route("/get/all/:userId").get(roomController.getRoomsByUserId);



roomRouter.route("/user/add/:roomId").put(roomController.addUserToRoom);

roomRouter.route("/user/remove/:roomId").put(roomController.removeUserFromRoom);

roomRouter
  .route("/speaker/remove/:roomId")
  .put(roomController.removeSpeakerRoom);

roomRouter
  .route("/invitedSpeaker/remove/:roomId")
  .put(roomController.removeInvitedSpeakerRoom);

roomRouter.route("/host/remove/:roomId").put(roomController.removeHostRoom);

roomRouter
  .route("/audience/remove/:roomId")
  .put(roomController.removeUserFromAudienceRoom);

roomRouter
  .route("/raisedhans/remove/:roomId")
  .put(roomController.removeRaisedHandRoom);

roomRouter
  .route("/agora/rooom/generatetoken")          
  .post(roomController.generateagoratoken);
roomRouter
  .route("/agora/rooom/rtmtoken/:id")          
  .get(roomController.generateRtmToken);


roomRouter.route("/allrooms/paginated").get(roomController.getAllTokshows);
roomRouter.route("/all/activetokshows").get(roomController.getActiveTokshows);

roomRouter.route("/add/product/:roomid").put(roomController.addProducttoRoom);
// roomRouter.route("/remove/featured").put(roomController.removeFeaturedProduct);
roomRouter
  .route("/remove/product/:roomid")
  .put(roomController.removeProductFromroom);

//events
roomRouter
  .route("/newevent/:userId")
  .post(roomController.createEvent);

roomRouter.route("/event/:roomId").get(roomController.getEventById);
roomRouter.route("/myevents/:userId").get(roomController.getMyEvents);
// roomRouter.route("/events/:id").get(roomController.getAllEvents); //to be removed
roomRouter.route("/all/events").get(roomController.getAllEvents);

module.exports = roomRouter;
