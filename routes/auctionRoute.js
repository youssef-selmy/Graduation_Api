const express = require("express");
const auctionController = require("../controller/auctionController");

const auctionRouter = express.Router();

auctionRouter.route("/").get(auctionController.getAuctions);
auctionRouter.route("/").post(auctionController.createAuction);
auctionRouter.route("/:id").put(auctionController.updateAuction);
auctionRouter.route("/:id").delete(auctionController.deleteAuction);
auctionRouter.route("/:roomid").get(auctionController.getActiveAuctionRoomId);
auctionRouter.route("/all/:roomid").get(auctionController.getAllAuctionRoomId);
// auctionRouter.route("/bid").post(auctionController.bid);
// auctionRouter.route("/bid/:id").put(auctionController.updateBid);
module.exports = auctionRouter;  