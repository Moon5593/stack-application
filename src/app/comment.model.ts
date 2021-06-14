import { Replies } from "./replies.model";

export class Comment{
    constructor(
        public id: string,
        public commentUserId: string,
        public comment: string,
        public postId: string,
        public postDate: Date,
        public userBadge: string,
        public userName: string,
        public userImage: string,
        public upvoteComment: number,
        public downvoteComment: number,
        public replies?: Replies[],
        public reply?: boolean
    ){}
}
