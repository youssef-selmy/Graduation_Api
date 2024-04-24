const mongoose = require("mongoose");

const { Schema, model } = mongoose;
// const decode = require("../shared/base64");

const value = {
  type: String,
  required: true,
};

const roomSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      // unique: true,
      ref: "User",
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        // required: true,
        ref: "product",
      },
    ],
    streamOptions: {
      type: Array,
      default: [],
    },
    hostIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitedhostIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    userIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // auctions: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "auction",
    //   },
    // ],
    // activeauction: {
    //   type: Schema.Types.ObjectId,
    //   ref: "auction",
    //   default: null,
    // },
    pin: {
      type: Schema.Types.ObjectId,
      ref: "product",
      default: null,
    },

    toBeNotified: {
      type: Array,
      default: [],
    },
    title: value,
    raisedHands: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    speakerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitedSpeakerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitedIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    allUsers: {
      type: Array,
      default: [],
    },
    speakersSentNotifications: {
      type: Array,
      default: [],
    },

    recordingIds: {
      type: Array,
      default: [],
    },
    event: {
      type: Boolean,
      default: false,
    },
    eventDate: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
    // shopId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "shop",
    //   required: true,
    // },
    // channel: [{
    //   type: Schema.Types.ObjectId,
    //   ref: "channel",
    // }],
    discount: {
      type: Number,
      default: 0.0,
    },

    productPrice: {
      type: Array,
      default: [],
    },

    token: {
      type: String,
    },
    description: {
      type: String,
      default: "",
    },

    resourceId: {
      type: String,
      default: "",
    },
    recordingUid: {
      type: String,
      default: "",
    },
    recordingsid: {
      type: String,
      default: "",
    },
    roomType: {
      type: String,
      default: "public",
    },
    activeTime: {
      type: Number,
      default: Date.now(),
    },
    ended: {
      type: Boolean,
      default: false,
    },
    endedTime: {
      type: Number,
    },
    allowrecording: {
      type: Boolean,
      default: true,
    },
    allowchat: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, autoIndex: true, autoCreate: true }
);

const roomModel = model("rooms", roomSchema);
module.exports = roomModel;
