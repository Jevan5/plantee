import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import Document from 'src/app/models/document';
import { environment } from 'src/environments/environment';
import ErrorHelper from 'src/app/utils/errorHelper';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) { }

  async delete<D extends Document>(id: string, model): Promise<D> {
    try {
      const res = await this.http.delete(`${environment.backEnd.url}:${environment.backEnd.port}/${model.nameForMultiple}/${id}`, {
        headers: this.auth.getAuthorizationHeader()
      }).toPromise();

      return new model(res[model.nameForSingle]);
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async getOne<D extends Document>(id: string, model): Promise<D> {
    try {
      const res = await this.http.get(`${environment.backEnd.url}:${environment.backEnd.port}/${model.nameForMultiple}/${id}`, {
        headers: this.auth.getAuthorizationHeader()
      }).toPromise();
  
      return new model(res[model.nameForSingle]);
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async getMany<D extends Document>(model): Promise<D[]> {
    try {
      const res = await this.http.get(`${environment.backEnd.url}:${environment.backEnd.port}/${model.nameForMultiple}`, {
        headers: this.auth.getAuthorizationHeader()
      }).toPromise();

      const docs = [];

      res[model.nameForMultiple].forEach((doc) => {
        docs.push(new model(doc));
      });

      return docs;
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async save<D extends Document>(doc: D, model): Promise<D> {
    try {
      if (doc._id === undefined) {
        const body = {};
        body[model.nameForSingle] = doc;

        const res = await this.http.post(`${environment.backEnd.url}:${environment.backEnd.port}/${model.nameForMultiple}`, body, {
          headers: this.auth.getAuthorizationHeader()
        }).toPromise();

        return new model(res[model.nameForSingle]);
      } else {
        const body = {};
        body[model.nameForSingle] = doc;

        const res = await this.http.put(`${environment.backEnd.url}:${environment.backEnd.port}/${model.nameForMultiple}/${doc._id}`, body, {
          headers: this.auth.getAuthorizationHeader()
        }).toPromise();

        return new model(res[model.nameForSingle]);
      }
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }
}
