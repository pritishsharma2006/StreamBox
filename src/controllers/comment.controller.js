import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query // Pagination , Fetching the comments in bundle of 10
    
    if(mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    const comments = await Comment.find({video: videoId})
            .sort({createdAt:-1})
            .skip((Number(page)-1)*Number(limit))
            .limit(Number(limit));
    return res.status(200).json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    if(!content?.trim()){
        throw new ApiError(400,"Comment content is required")
    }
    const comment = await Comment.create({
        content, 
        video: videoId,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(
            201,
            comment,
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    if(mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comment id");
    }
    if(!content?.trim()){
        throw new ApiError(400,"Content is required");
    }
    const commment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"comment not found");
    }

    if(!comment.owner.equals(req.user._id)){
        throw new ApiError("You are not authorized to update this comment")
    }

    commment.content = content;
    await commment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid comment Id");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if(!comment.owner.equals(req.user._id)){
        throw new ApiError(403,"You are not authorized to delete this comment");
    }
    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }