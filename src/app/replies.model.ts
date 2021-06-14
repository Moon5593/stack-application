export class Replies{
    constructor(
        public id: string,
        public replyUserId: string,
        public replyTo: string,
        public reply: string,
        public replyDate: Date,
        public userBadge: string,
        public userName: string,
        public userImage: string,
        public upvoteReply: number,
        public downvoteReply: number,
        public replyToReply?: boolean
    ){}
}
