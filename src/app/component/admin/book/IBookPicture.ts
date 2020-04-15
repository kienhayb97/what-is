import {IBook} from './IBook';

export interface IBookPicture {
  id: number;
  src: string;
  //_idbook
  book: IBook;
}
