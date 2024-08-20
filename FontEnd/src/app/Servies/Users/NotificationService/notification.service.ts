import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
 baseUrl = "http://localhost:3000/"
  constructor(private http:HttpClient,private router:Router) { }


  sendLikeNotification(NotificationData:any){

    console.log("passing notifiacation add fun",NotificationData)
    return this.http.post<any>(`${this.baseUrl}api/common/AddNofication`, NotificationData);

  }
}
