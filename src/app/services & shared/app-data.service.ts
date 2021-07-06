import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { BehaviorSubject, from, of, Subject } from 'rxjs';
import { delay, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Question } from '../models/question.model';
import { Comment } from '../models/comment.model';
import { Replies } from '../models/replies.model';
import { NavController } from '@ionic/angular';

export interface AppQuestions{
  anonymous?: boolean;
  catagory: string;
  details: string;
  imageData?: string;
  notif?: boolean;
  policy: boolean;
  postDate: string;
  private_question?: boolean;
  question: string;
  tags: string[];
  userId: string;
  add_answers?: string[];
  createdBy: string;
  createdUserRepPoints: number;
  upCount: number;
  downCount: number;
  totalComments: number;
  userImage?: string;
}

export interface CommentsAndReplies{
  commentUserId: string;
  comment: string;
  postId: string;
  postDate: Date;
  userRepPoints: number;
  userName: string;
  userImage: string;
  upvoteComment: number;
  downvoteComment: number;
  replies?: Replies[];
  reply?: boolean;
  atLeastOneUpvote?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppDataService implements OnInit{
  public icon = new Subject<boolean>();
  private _questions = new BehaviorSubject<Question[]>([]);
  private _tQuestions = new BehaviorSubject<Question[]>([]);
  private _comments = new BehaviorSubject<Comment[]>([]);
  private _tComments = new BehaviorSubject<Comment[]>([]);
  private _replies = new BehaviorSubject<Comment[]>([]);
  public clickEmitter = new Subject<boolean>();
  private _totalComments = new BehaviorSubject<Comment[]>([]);
  private totalC: any[] = [];
  public loadingEmitter = new Subject<boolean>();
  public cLoadingEmitter = new Subject<boolean>();
  private latestKey: string;
  public stopScroll = new Subject<boolean>();
  private runtimeQLength: number;
  public listQ = [];
  public listA = [];
  //public listB = [];
  private postIds = [];
  public bestA: number = 0;
  private _listQ = new BehaviorSubject<any[]>([]);
  private _listA = new BehaviorSubject<any[]>([]);
  private _bestA = new BehaviorSubject<number>(0);
  public networkStatusRunTime = new Subject<boolean>();
  public tagsList = [];

  constructor(private authService: AuthService, private http: HttpClient, private navCtrl: NavController) {}

  get questions(){
    return this._questions.asObservable();
  }

  get comments(){
    return this._comments.asObservable();
  }

  get tComments(){
    return this._tComments.asObservable();
  }

  get tQuestions(){
    return this._tQuestions.asObservable();
  }

  get totalComments(){
    return this._totalComments.asObservable();
  }

  get replies(){
    return this._replies.asObservable();
  }

  get totalListQues(){
    return this._listQ.asObservable();
  }

  get totalListAns(){
    return this._listA.asObservable();
  }

  get bestAns(){
    return this._bestA.asObservable();
  }

  ngOnInit(){}

  getQuestion(id: string){
    let question: Question;
    let updatedQuestion: Question[];
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        if(!token){
          return this.authService.aToken;
        }else{
          return of(token);
        }
      }),
      switchMap(token=>{
        return this.http.get<AppQuestions>(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/questions/${id}.json?auth=${token}`
        );
      }),
      switchMap(questionData => {
        question = new Question(
          id,
          questionData.userId,
          questionData.question,
          questionData.catagory,
          questionData.tags,
          questionData.add_answers,
          questionData.imageData,
          questionData.details,
          new Date(questionData.postDate),
          questionData.anonymous,
          questionData.private_question,
          questionData.notif,
          questionData.policy,
          questionData.createdBy,
          questionData.createdUserRepPoints,
          questionData.upCount,
          questionData.downCount,
          questionData.totalComments,
          questionData.userImage
        );
        return this.questions;
      }),
      take(1),
      map(questions=>{
        const questionIndex = questions.findIndex(q=>q.id===id);
          if(questionIndex !== -1){
            updatedQuestion = [...questions];
            updatedQuestion[questionIndex] = question;
            this._questions.next(updatedQuestion);
          }else{
            questions[0] = question;
            this._questions.next(questions);
          }
          return question;
        //this._questions.next(question);
      })
    );
  }

  postQuestion(
    question: string,
    catagory: string,
    tags: string[],
    add_answers: string[],
    image: string,
    details: string,
    current_date: Date,
    anonymous: boolean,
    private_question: boolean,
    notif: boolean,
    policy: boolean
  ){
    let fetchedUserId: string;
    let post: Question;
    let generatedId: string;
    let fetchedUsername: string;
    let fetchedUserPoints: number;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        fetchedUserImage = userImage;
        return this.authService.userPoints;
      }),
      take(1),
      switchMap(userPoints=>{
        if (!userPoints) {
          fetchedUserPoints = 0;
        }
        fetchedUserPoints = userPoints;
        return this.authService.userName;
      }),
      take(1),
      switchMap(userName=>{
        if (!userName) {
          throw new Error('No username found!');
        }
        fetchedUsername = userName;
        return this.authService.userId;
      }),
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('No user id found!');
        }
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token=>{
        post = new Question(
          Math.random().toString(),
          fetchedUserId,
          question,
          catagory,
          tags,
          add_answers,
          image,
          details,
          current_date,
          anonymous,
          private_question,
          notif,
          policy,
          fetchedUsername,
          fetchedUserPoints,
          0,
          0,
          0,
          fetchedUserImage
        );
        return this.http.post<{name: string;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?auth=${token}`,
        {
          ...post, id: null
        }
        );
      }),
      switchMap(resData=>{
        generatedId = resData.name;
        return this.questions;
      }),
      take(1),
      tap(questions=>{
        post.id = generatedId;
        if(!questions){
          questions = [];
          this._questions.next(questions.concat(post));
        }else{
          this._questions.next(questions.concat(post));
        }
        setTimeout(() => {
          this.listQ.push(post.id);
          this._listQ.next(this.listQ);
          this.navCtrl.navigateForward(`/app/home/${post.id}`, {animated: true, animationDirection: 'forward'});
        }, 1000);
      })
    );
  }

  fetchTTQuestions(){
    let tokenData;
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        if(!token){
          return this.authService.aToken;
        }else{
          return of(token);
        }
      }),
      switchMap(token=>{
        tokenData = token;
        if(this.listQ.length<1){
          return this.http.get<{[key: string]: boolean;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?shallow=true&auth=${token}`);
        }
        return of(null);
      }),
      switchMap(dataReturned=>{
        if(dataReturned){
          for(const key in dataReturned){
            if(dataReturned.hasOwnProperty(key)){
              this.listQ.push(key);
            }
          }
          this._listQ.next(this.listQ);
          //this.valInit.next(true);
        }
        return this.http.get<{[key: string]: AppQuestions}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?orderBy="totalComments"&limitToLast=3&auth=${tokenData}`);
      }),
      map(questionData=>{
        const questions = [];
        for(const key in questionData){
          if(questionData.hasOwnProperty(key)){
            questions.push(
              new Question(
                key,
                questionData[key].userId,
                questionData[key].question,
                questionData[key].catagory,
                questionData[key].tags,
                questionData[key].add_answers,
                questionData[key].imageData,
                questionData[key].details,
                new Date(questionData[key].postDate),
                questionData[key].anonymous,
                questionData[key].private_question,
                questionData[key].notif,
                questionData[key].policy,
                questionData[key].createdBy,
                questionData[key].createdUserRepPoints,
                questionData[key].upCount,
                questionData[key].downCount,
                questionData[key].totalComments,
                questionData[key].userImage
              )
            );
          }
        }
        return questions;
      }),
      tap(questions=>{
        questions.map(q=>{
          if(q.userImage){
            if(!q.userImage.startsWith('data:image/jpeg;base64,')){
              q.userImage = 'data:image/jpeg;base64,'+q.userImage;
            }
          }
        });
        this._tQuestions.next(questions);
      })
    );
  }

  fetchQuestions(questionLength?: number){
    let tokenData;
    this.runtimeQLength = questionLength;
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        if(!token){
          return this.authService.aToken;
        }else{
          return of(token);
        }
      }),
      switchMap(token=>{
        tokenData = token;
        if(this.listQ.length<1){
          return this.http.get<{[key: string]: boolean;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?shallow=true&auth=${token}`);
        }
        return of(null);
      }),
      switchMap(dataReturned=>{
        if(dataReturned){
          for(const key in dataReturned){
            if(dataReturned.hasOwnProperty(key)){
              this.listQ.push(key);
            }
          }
          this._listQ.next(this.listQ);
          //this.valInit.next(true);
        }

        if(!this.latestKey){
          return this.http.get<{[key: string]: AppQuestions}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?orderBy="$key"&limitToFirst=3&auth=${tokenData}`);
        }
        if((this.listQ.length - this.runtimeQLength)<3){
          let limitToL = this.listQ.length - this.runtimeQLength;
          if(limitToL>0){
            return this.http.get<{[key: string]: AppQuestions}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?orderBy="$key"&startAt="${this.latestKey+1}"&limitToLast=${limitToL}&auth=${tokenData}`);
          }
        }
        return this.http.get<{[key: string]: AppQuestions}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?orderBy="$key"&startAt="${this.latestKey+1}"&limitToFirst=3&auth=${tokenData}`);
      }),
      map(questionData=>{
        if(!questionData){
          this.stopScroll.next(true);
          return;
        }
        const questions = [];
        for(const key in questionData){
          if(questionData.hasOwnProperty(key)){
            questions.push(
              new Question(
                key,
                questionData[key].userId,
                questionData[key].question,
                questionData[key].catagory,
                questionData[key].tags,
                questionData[key].add_answers,
                questionData[key].imageData,
                questionData[key].details,
                new Date(questionData[key].postDate),
                questionData[key].anonymous,
                questionData[key].private_question,
                questionData[key].notif,
                questionData[key].policy,
                questionData[key].createdBy,
                questionData[key].createdUserRepPoints,
                questionData[key].upCount,
                questionData[key].downCount,
                questionData[key].totalComments,
                questionData[key].userImage
              )
            );
            this.latestKey = key;
          }
        }
        return questions;
      }),
      tap(questions=>{
        if(!this.latestKey){
          this._questions.next(questions);
        }else{
          if(questions){
            this.questions.pipe(take(1)).subscribe(q=>{
              if(!q){
                q = [];
                this._questions.next(q.concat(questions));
              }else{
                this._questions.next(q.concat(questions));
              }
            });
          }
        }
      })
    );
  }

  fetchTotalAnswers(){
    let token;
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        if(!token){
          return this.authService.aToken;
        }else{
          return of(token);
        }
      }),
      switchMap(tokenData=>{
        token = tokenData;
        if(this.listA.length<1){
          return this.http.get<{[key: string]: boolean;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments.json?shallow=true&auth=${token}`);
        }
        return of(null);
      }),
      switchMap(AKeyReturned=>{
        if(AKeyReturned){
          for(const key in AKeyReturned){
            if(AKeyReturned.hasOwnProperty(key)){
              this.listA.push(key);
            }
          }
          this._listA.next(this.listA);
          console.log(this.listA);
        }
        return of(this.listA);
      }),
      map(listA=>{
        from(listA).pipe(
          //takeUntil(this.valInit),
          //repeatWhen(()=>this.valInit),
          mergeMap(dataFrom=>{
            return this.http.get(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${dataFrom}/atLeastOneUpvote.json?shallow=true&auth=${token}`);
          }),
          tap(setFetched=>{
            this.postIds.push(setFetched);
          })
        ).subscribe(
          next=>{},
          err=>{},
          ()=>{
            let obj = {};
            this.postIds.sort();
            for(let p of this.postIds){
              obj[p] = ++obj[p] || 1;
            }
            this.bestA = obj['true'];
            this._bestA.next(this.bestA);
            console.log(obj);
          });
      })
    );
  }

  upvoteReply(commentId: string, replyId: string){
    let fetchedToken: string;
    let updatedComments: Comment[];
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.comments;
      }),
      take(1),
      switchMap(comments=>{
        const updatedCommentIndex = comments.findIndex(q => q.id === commentId);
        updatedComments = [...comments];
        const oldReplyIndex = updatedComments[updatedCommentIndex].replies.findIndex(r => r.id === replyId);
        const oldReply = updatedComments[updatedCommentIndex].replies[oldReplyIndex];

        updatedComments[updatedCommentIndex].replies[oldReplyIndex] = new Replies(
          oldReply.id,
          oldReply.replyUserId,
          oldReply.replyTo,
          oldReply.reply,
          oldReply.replyDate,
          oldReply.userRepPoints,
          oldReply.userName,
          oldReply.userImage,
          oldReply.upvoteReply + 1,
          oldReply.downvoteReply
        );
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${commentId}/replies/${replyId}.json?auth=${fetchedToken}`,
          { ...updatedComments[updatedCommentIndex].replies[oldReplyIndex], id: null }
        );
      }),
      tap(() => {
        this._comments.next(updatedComments);
      })
    );
  }

  downvoteReply(commentId: string, replyId: string){
    let fetchedToken: string;
    let updatedComments: Comment[];
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.comments;
      }),
      take(1),
      switchMap(comments=>{
        const updatedCommentIndex = comments.findIndex(q => q.id === commentId);
        updatedComments = [...comments];
        const oldReplyIndex = updatedComments[updatedCommentIndex].replies.findIndex(r => r.id === replyId);
        const oldReply = updatedComments[updatedCommentIndex].replies[oldReplyIndex];

        updatedComments[updatedCommentIndex].replies[oldReplyIndex] = new Replies(
          oldReply.id,
          oldReply.replyUserId,
          oldReply.replyTo,
          oldReply.reply,
          oldReply.replyDate,
          oldReply.userRepPoints,
          oldReply.userName,
          oldReply.userImage,
          oldReply.upvoteReply,
          oldReply.downvoteReply - 1
        );
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${commentId}/replies/${replyId}.json?auth=${fetchedToken}`,
          { ...updatedComments[updatedCommentIndex].replies[oldReplyIndex], id: null }
        );
      }),
      tap(() => {
        this._comments.next(updatedComments);
      })
    );
  }

  downvoteComment(id: string){
    let fetchedToken: string;
    let updatedComments: Comment[];

    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.comments;
      }),
      take(1),
      switchMap(comments=>{
        const updatedCommentIndex = comments.findIndex(q => q.id === id);
        updatedComments = [...comments];
        const oldComment = updatedComments[updatedCommentIndex];
        updatedComments[updatedCommentIndex] = new Comment(
          oldComment.id,
          oldComment.commentUserId,
          oldComment.comment,
          oldComment.postId,
          oldComment.postDate,
          oldComment.userRepPoints,
          oldComment.userName,
          oldComment.userImage,
          oldComment.upvoteComment,
          oldComment.downvoteComment - 1,
          oldComment.replies,
          oldComment.reply,
          oldComment.atLeastOneUpvote
        );
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${id}.json?auth=${fetchedToken}`,
          { ...updatedComments[updatedCommentIndex], id: null }
        );
      }),
      tap(() => {
        this._comments.next(updatedComments);
      })
    );
  }

  upvoteComment(id: string){
    let fetchedToken: string;
    let updatedComments: Comment[];

    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.comments;
      }),
      take(1),
      switchMap(comments=>{
        const updatedCommentIndex = comments.findIndex(q => q.id === id);
        updatedComments = [...comments];
        const oldComment = updatedComments[updatedCommentIndex];
        const isTrue = comments.findIndex(t => t.atLeastOneUpvote === true);
        if(isTrue === -1){
          this._bestA.next(this.bestA+1);
          oldComment.atLeastOneUpvote = true;
        }
        updatedComments[updatedCommentIndex] = new Comment(
          oldComment.id,
          oldComment.commentUserId,
          oldComment.comment,
          oldComment.postId,
          oldComment.postDate,
          oldComment.userRepPoints,
          oldComment.userName,
          oldComment.userImage,
          oldComment.upvoteComment + 1,
          oldComment.downvoteComment,
          oldComment.replies,
          oldComment.reply,
          oldComment.atLeastOneUpvote
        );
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${id}.json?auth=${fetchedToken}`,
          { ...updatedComments[updatedCommentIndex], id: null }
        );
      }),
      tap(() => {
        this._comments.next(updatedComments);
      })
    );
  }

  upvote(id: string){
    let fetchedToken: string;
    let updatedQuestions: Question[];

    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.questions;
      }),
      take(1),
      switchMap(questions=>{
        if (!questions || questions.length <= 0) {
          return this.fetchQuestions();
        } else {
          return of(questions);
        }
      }),
      switchMap(questions=>{
        const updatedQuestionIndex = questions.findIndex(q => q.id === id);
        updatedQuestions = [...questions];
        const oldQuestion = updatedQuestions[updatedQuestionIndex];
        updatedQuestions[updatedQuestionIndex] = new Question(
          oldQuestion.id,
          oldQuestion.userId,
          oldQuestion.question,
          oldQuestion.catagory,
          oldQuestion.tags,
          oldQuestion.add_answers,
          oldQuestion.imageData,
          oldQuestion.details,
          oldQuestion.postDate,
          oldQuestion.anonymous,
          oldQuestion.private_question,
          oldQuestion.notif,
          oldQuestion.policy,
          oldQuestion.createdBy,
          oldQuestion.createdUserRepPoints,
          oldQuestion.upCount + 1,
          oldQuestion.downCount,
          oldQuestion.totalComments,
          oldQuestion.userImage
        );
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/questions/${id}.json?auth=${fetchedToken}`,
          { ...updatedQuestions[updatedQuestionIndex], id: null }
        );
      }),
      tap(() => {
        this._questions.next(updatedQuestions);
      })
    );
  }

  downvote(id: string){
    let fetchedToken: string;
    let updatedQuestions: Question[];

    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.questions;
      }),
      take(1),
      switchMap(questions=>{
        if (!questions || questions.length <= 0) {
          return this.fetchQuestions();
        } else {
          return of(questions);
        }
      }),
      switchMap(questions=>{
        const updatedQuestionIndex = questions.findIndex(q => q.id === id);
        updatedQuestions = [...questions];
        const oldQuestion = updatedQuestions[updatedQuestionIndex];
        updatedQuestions[updatedQuestionIndex] = new Question(
          oldQuestion.id,
          oldQuestion.userId,
          oldQuestion.question,
          oldQuestion.catagory,
          oldQuestion.tags,
          oldQuestion.add_answers,
          oldQuestion.imageData,
          oldQuestion.details,
          oldQuestion.postDate,
          oldQuestion.anonymous,
          oldQuestion.private_question,
          oldQuestion.notif,
          oldQuestion.policy,
          oldQuestion.createdBy,
          oldQuestion.createdUserRepPoints,
          oldQuestion.upCount,
          oldQuestion.downCount - 1,
          oldQuestion.totalComments,
          oldQuestion.userImage
        );
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/questions/${id}.json?auth=${fetchedToken}`,
          { ...updatedQuestions[updatedQuestionIndex], id: null }
        );
      }),
      tap(() => {
        this._questions.next(updatedQuestions);
      })
    );
  }

  createComment(postId: string, details: string, commentTime: Date){
    let fetchedUserId: string;
    let comment: Comment;
    let generatedId: string;
    let fetchedUsername: string;
    let fetchedUserRepPoints: number;
    let fetchedUserImage: string;
    let token: string;
    let commentsFetchedLength: number;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userPoints;
      }),
      take(1),
      switchMap(userPoints=>{
        if (!userPoints) {
          fetchedUserRepPoints = 0;
        }
        fetchedUserRepPoints = userPoints;
        return this.authService.userName;
      }),
      take(1),
      switchMap(userName=>{
        if (!userName) {
          throw new Error('No username found!');
        }
        fetchedUsername = userName;
        return this.authService.userId;
      }),
      take(1),
      switchMap(userId=>{
        if (!userId) {
          throw new Error('No user id found!');
        }
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(fetchedToken=>{
        token = fetchedToken;
        comment = new Comment(
          Math.random().toString(),
          fetchedUserId,
          details,
          postId,
          commentTime,
          fetchedUserRepPoints,
          fetchedUsername,
          fetchedUserImage,
          0,
          0
        );
        return this.http.post<{name: string;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments.json?auth=${token}`,
        {
          ...comment, id: null
        }
        );
      }),
      switchMap(resData=>{
        generatedId = resData.name;
        return this.comments;
      }),
      take(1),
      switchMap(comments=>{
        comment.id = generatedId;
        this.listA.push(comment.id);
        this._listA.next(this.listA);
        this._comments.next(comments.concat(comment));
        return this.comments;
      }),
      take(1),
      switchMap(comments=>{
        return this.http.put(
          `https://stack-app-8a187-default-rtdb.firebaseio.com/questions/${postId}/totalComments.json?auth=${token}`,
          comments.length
        );
      }),
      switchMap(cLength=>{
        commentsFetchedLength = cLength;
        return this.questions;
      }),
      take(1),
      tap(questions=>{
        if(questions.length>0){
          const updatedQuestionIndex = questions.findIndex(q => q.id === postId);
          let updatedQuestions = [...questions];
          const oldQuestion = updatedQuestions[updatedQuestionIndex];
          updatedQuestions[updatedQuestionIndex] = new Question(
            oldQuestion.id,
            oldQuestion.userId,
            oldQuestion.question,
            oldQuestion.catagory,
            oldQuestion.tags,
            oldQuestion.add_answers,
            oldQuestion.imageData,
            oldQuestion.details,
            oldQuestion.postDate,
            oldQuestion.anonymous,
            oldQuestion.private_question,
            oldQuestion.notif,
            oldQuestion.policy,
            oldQuestion.createdBy,
            oldQuestion.createdUserRepPoints,
            oldQuestion.upCount,
            oldQuestion.downCount - 1,
            commentsFetchedLength,
            oldQuestion.userImage
          );
          this._questions.next(updatedQuestions);
        }

      })
    );
  }

  fetchTopComments(){
    this.cLoadingEmitter.next(true);
    this._tComments.next([]);
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        if(!token){
          return this.authService.aToken;
        }else{
          return of(token);
        }
      }),
      switchMap(token=>{
        return this.http.get<{[key: string]: CommentsAndReplies}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments.json?orderBy="postDate"&limitToFirst=3&auth=${token}`);
      }),
      map(commentData=>{
        const comments = [];
        for(const key in commentData){
          let replies = [];
          for(let r in commentData[key].replies){
            if(commentData[key].replies.hasOwnProperty(r)){
              replies.push(
                new Replies(
                  r,
                  commentData[key].replies[r].replyUserId,
                  commentData[key].replies[r].replyTo,
                  commentData[key].replies[r].reply,
                  new Date(commentData[key].replies[r].replyDate),
                  commentData[key].replies[r].userRepPoints,
                  commentData[key].replies[r].userName,
                  commentData[key].replies[r].userImage,
                  commentData[key].replies[r].upvoteReply,
                  commentData[key].replies[r].downvoteReply
                )
              );
            }
          }
          commentData[key].replies = replies;
          this._replies.next(replies);
          if(commentData.hasOwnProperty(key)){
            comments.push(
              new Comment(
                key,
                commentData[key].commentUserId,
                commentData[key].comment,
                commentData[key].postId,
                new Date(commentData[key].postDate),
                commentData[key].userRepPoints,
                commentData[key].userName,
                commentData[key].userImage,
                commentData[key].upvoteComment,
                commentData[key].downvoteComment,
                commentData[key].replies,
                commentData[key].reply,
                commentData[key].atLeastOneUpvote
              )
            );
          }
        }
        return comments;
      }),
      tap(comments=>{
        comments = comments.reverse();
        this._tComments.next(comments);
      })
    );
  }

  fetchComments(postId: string){
    return this.authService.token.pipe(
      take(1),
      switchMap(token=>{
        if(!token){
          return this.authService.aToken;
        }else{
          return of(token);
        }
      }),
      switchMap(token=>{
        return this.http.get<{[key: string]: CommentsAndReplies}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments.json?orderBy="postId"&equalTo="${postId}"&auth=${token}`);
      }),
      map(commentData=>{
        const comments = [];
        for(const key in commentData){
          let replies = [];
          for(let r in commentData[key].replies){
            if(commentData[key].replies.hasOwnProperty(r)){
              replies.push(
                new Replies(
                  r,
                  commentData[key].replies[r].replyUserId,
                  commentData[key].replies[r].replyTo,
                  commentData[key].replies[r].reply,
                  new Date(commentData[key].replies[r].replyDate),
                  commentData[key].replies[r].userRepPoints,
                  commentData[key].replies[r].userName,
                  commentData[key].replies[r].userImage,
                  commentData[key].replies[r].upvoteReply,
                  commentData[key].replies[r].downvoteReply
                )
              );
            }
          }
          commentData[key].replies = replies;
          this._replies.next(replies);
          if(commentData.hasOwnProperty(key)){
            comments.push(
              new Comment(
                key,
                commentData[key].commentUserId,
                commentData[key].comment,
                commentData[key].postId,
                new Date(commentData[key].postDate),
                commentData[key].userRepPoints,
                commentData[key].userName,
                commentData[key].userImage,
                commentData[key].upvoteComment,
                commentData[key].downvoteComment,
                commentData[key].replies,
                commentData[key].reply,
                commentData[key].atLeastOneUpvote
              )
            );
          }
        }
        return comments;
      }),
      tap(comments=>{
        console.log(comments);
        for(let comment of comments){
          if(comment){
            this.totalC.push(comment);
          }
        }
        this.totalC = [...new Map(this.totalC.map(item => [item['id'], item])).values()];
        this._totalComments.next(this.totalC);
        comments = comments.sort((a, b)=> a.postDate - b.postDate);
        this._comments.next(comments);
      })
    );
  }

  createReply(commentId: string, details: string, repliedTime: Date, commentIndex: number){
    let fetchedUserId: string;
    let reply: Replies;
    let generatedId: string;
    let fetchedUsername: string;
    let fetchedUserRepPoints: number;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userPoints;
      }),
      take(1),
      switchMap(userPoints=>{
        if (!userPoints) {
          fetchedUserRepPoints = 0;
        }
        fetchedUserRepPoints = userPoints;
        return this.authService.userName;
      }),
      take(1),
      switchMap(userName=>{
        if (!userName) {
          throw new Error('No username found!');
        }
        fetchedUsername = userName;
        return this.authService.userId;
      }),
      take(1),
      switchMap(userId=>{
        if (!userId) {
          throw new Error('No user id found!');
        }
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token=>{
        reply = new Replies(
          Math.random().toString(),
          fetchedUserId,
          commentId,
          details,
          repliedTime,
          fetchedUserRepPoints,
          fetchedUsername,
          fetchedUserImage,
          0,
          0
        );
        return this.http.post<{name: string;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${commentId}/replies.json?auth=${token}`,
        {
          ...reply, id: null
        }
        );
      }),
      switchMap(resData=>{
        generatedId = resData.name;
        return this.comments;
      }),
      take(1),
      tap(comments=>{
        reply.id = generatedId;
        if(!comments[commentIndex].replies){
          comments[commentIndex].replies = [];
        }
        comments[commentIndex].replies = comments[commentIndex].replies.concat(reply);
        this._comments.next(comments);
      })
    );
  }

  createReplyToReply(commentId: string, repliedToId: string, details: string, repliedTime: Date, commentIndex: number, replyIndex: number){
    let fetchedUserId: string;
    let reply: Replies;
    let generatedId: string;
    let fetchedUsername: string;
    let fetchedUserRepPoints: number;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userPoints;
      }),
      take(1),
      switchMap(userPoints=>{
        if (!userPoints) {
          fetchedUserRepPoints = 0;
        }
        fetchedUserRepPoints = userPoints;
        return this.authService.userName;
      }),
      take(1),
      switchMap(userName=>{
        if (!userName) {
          throw new Error('No username found!');
        }
        fetchedUsername = userName;
        return this.authService.userId;
      }),
      take(1),
      switchMap(userId=>{
        if (!userId) {
          throw new Error('No user id found!');
        }
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token=>{
        reply = new Replies(
          Math.random().toString(),
          fetchedUserId,
          repliedToId,
          details,
          repliedTime,
          fetchedUserRepPoints,
          fetchedUsername,
          fetchedUserImage,
          0,
          0
        );
        return this.http.post<{name: string;}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/comments/${commentId}/replies.json?auth=${token}`,
        {
          ...reply, id: null
        }
        );
      }),
      switchMap(resData=>{
        generatedId = resData.name;
        return this.comments;
      }),
      take(1),
      tap(comments=>{
        reply.id = generatedId;
        comments[commentIndex].replies = comments[commentIndex].replies.concat(reply);
        this._comments.next(comments);
      })
    );

  }

}
