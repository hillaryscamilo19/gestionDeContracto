import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { User } from 'src/app/models/User/user/user.module';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromLocalStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { name, email, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.storeUserData(response);
          }
        }),
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.storeUserData(response);
          }
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string {
    const token = localStorage.getItem('token');
    return token || '';
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  private storeUserData(response: any): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response));
    this.currentUserSubject.next(response);
  }

  private getUserFromLocalStorage(): any {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {
      return null;
    }
  }
}
