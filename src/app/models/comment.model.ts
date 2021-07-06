import { Replies } from "./replies.model";

export class Comment{
    constructor(
        public id: string,
        public commentUserId: string,
        public comment: string,
        public postId: string,
        public postDate: Date,
        public userRepPoints: number,
        public userName: string,
        public upvoteComment: number,
        public downvoteComment: number,
        public userImage?: string,
        public replies?: Replies[],
        public reply?: boolean,
        public atLeastOneUpvote?: boolean
    ){}
}
