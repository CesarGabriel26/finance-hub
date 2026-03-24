import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataNotificationService {
  private dataChangeSubject = new Subject<void>();
  dataChange$ = this.dataChangeSubject.asObservable();

  notifyDataChange() {
    this.dataChangeSubject.next();
  }
}
