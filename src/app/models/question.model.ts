export class Question{
    constructor(
        public id: string,
        public userId: string,
        public question: string,
        public catagory: string,
        public tags: string[],
        public add_answers: string[],
        public imageData: string,
        public details: string,
        public postDate: Date,
        public anonymous: boolean,
        public private_question: boolean,
        public notif: boolean,
        public policy: boolean,
        public createdBy: string,
        public createdUserRepPoints: number,
        public upCount: number,
        public downCount: number,
        public totalComments: number,
        public userImage: string
    ){}
}
