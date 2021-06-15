import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { BehaviorSubject, from, of, Subject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService, TotalData } from './auth.service';
import { Question } from '../models/question.model';
import { Comment } from '../models/comment.model';
import { Replies } from '../models/replies.model';
import { Totals } from '../models/totals.model';

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
  createdUserBadge: string;
  upCount: number;
  downCount: number;
  userImage: string;
}

export interface CommentsAndReplies{
  commentUserId: string;
  comment: string;
  postId: string;
  postDate: Date;
  userBadge: string;
  userName: string;
  userImage: string;
  upvoteComment: number;
  downvoteComment: number;
  replies?: Replies[]
}

@Injectable({
  providedIn: 'root'
})
export class AppDataService implements OnInit{
  icon = new Subject<boolean>();
  private _questions = new BehaviorSubject<Question[]>([]);
  private _comments = new BehaviorSubject<Comment[]>([]);
  private _replies = new BehaviorSubject<Comment[]>([]);
  public clickEmitter = new Subject<boolean>();
  private _totalComments = new BehaviorSubject<Comment[]>([]);
  private totalC: any[] = [];
  public loadingEmitter = new Subject<boolean>();

  constructor(private authService: AuthService, private http: HttpClient) {}

  get questions(){
    return this._questions.asObservable();
  }

  get comments(){
    return this._comments.asObservable();
  }

  get totalComments(){
    return this._totalComments.asObservable();
  }

  get replies(){
    return this._replies.asObservable();
  }

  ngOnInit(){}

  getQuestion(id: string){
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
      map(questionData => {
        return new Question(
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
          questionData.createdUserBadge,
          questionData.upCount,
          questionData.downCount,
          questionData.userImage
        );
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
    let fetchedUserBadge: string;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userBadge;
      }),
      take(1),
      switchMap(userBadge=>{
        if (!userBadge) {
          throw new Error('No userbadge found!');
        }
        fetchedUserBadge = userBadge;
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
          fetchedUserBadge,
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
        this._questions.next(questions.concat(post));
      })
    );
  }

  setQuestionTotal(){
    let fetchedToken;
    let total;
    return this.authService.token
    .pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.http.get<{[key: string]: TotalData}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/totals.json?auth=${fetchedToken}`);
      }),
      switchMap(totalData=>{
        for(let key in totalData){
          if(totalData.hasOwnProperty(key)){
            total = new Totals(
              totalData[key].users,
              totalData[key].questions+1,
              totalData[key].answers,
              totalData[key].best_answers
            );
          }
        }
        return this.http.put(`https://stack-app-8a187-default-rtdb.firebaseio.com/totals.json?auth=${fetchedToken}`,
        {...total});
      })
    );
  }

  fetchQuestions(){
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
        return this.http.get<{[key: string]: AppQuestions}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/questions.json?auth=${token}`);
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
                questionData[key].createdUserBadge,
                questionData[key].upCount,
                questionData[key].downCount,
                questionData[key].userImage
              )
            );
          }
        }
        return questions;
      }),
      tap(questions=>{
        this._questions.next(questions);
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
          oldQuestion.createdUserBadge,
          oldQuestion.upCount + 1,
          oldQuestion.downCount,
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
          oldQuestion.createdUserBadge,
          oldQuestion.upCount,
          oldQuestion.downCount - 1,
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
    let fetchedUserBadge: string;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userBadge;
      }),
      take(1),
      switchMap(userBadge=>{
        if (!userBadge) {
          throw new Error('No userbadge found!');
        }
        fetchedUserBadge = userBadge;
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
        comment = new Comment(
          Math.random().toString(),
          fetchedUserId,
          details,
          postId,
          commentTime,
          fetchedUserBadge,
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
      tap(comments=>{
        comment.id = generatedId;
        this._comments.next(comments.concat(comment));
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
                  commentData[key].replies[r].userBadge,
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
                commentData[key].userBadge,
                commentData[key].userName,
                commentData[key].userImage,
                commentData[key].upvoteComment,
                commentData[key].downvoteComment,
                commentData[key].replies
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
    let fetchedUserBadge: string;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userBadge;
      }),
      take(1),
      switchMap(userBadge=>{
        if (!userBadge) {
          throw new Error('No userbadge found!');
        }
        fetchedUserBadge = userBadge;
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
          fetchedUserBadge,
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
        console.log('in reply');
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
    let fetchedUserBadge: string;
    let fetchedUserImage: string;

    return this.authService.userImage.pipe(
      take(1),
      switchMap(userImage=>{
        if (!userImage) {
          throw new Error('No userimage found!');
        }
        fetchedUserImage = userImage;
        return this.authService.userBadge;
      }),
      take(1),
      switchMap(userBadge=>{
        if (!userBadge) {
          throw new Error('No userbadge found!');
        }
        fetchedUserBadge = userBadge;
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
          fetchedUserBadge,
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
