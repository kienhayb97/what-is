import {Component, OnInit} from '@angular/core';
import {BookService} from '../book.service';
import {IBook} from '../IBook';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthorService} from '../../author/author.service';
import {CategoryService} from '../../category/category.service';
import {LanguageService} from '../../language/language.service';
import {PublishingService} from '../../publishing/publishing.service';
import {BookPictureService} from '../book-picture.service';
import {AppComponent} from '../../../../app.component';
import {ICategory} from '../../category/ICategory';
import {AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask} from 'angularfire2/storage';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-book-edit',
  templateUrl: './book-edit.component.html',
  styleUrls: ['./book-edit.component.css']
})
export class BookEditComponent implements OnInit {
  ref: AngularFireStorageReference;
  task: AngularFireUploadTask;
  uploadProgress: Observable<number>;
  bookForm: FormGroup;
  useFile: any[];
  book: IBook;
  authorList: any;
  authors: any;
  categoryList: any;
  category: ICategory;
  languageList: any;
  languages: any;
  publishingList: any;
  publishing: any;
  previewUrl: any[];
  message = false;
  bookPictures: any[];

  constructor(
    private bookService: BookService,
    private authorService: AuthorService,
    private categoryService: CategoryService,
    private languageService: LanguageService,
    private publishingService: PublishingService,
    private bookPictureService: BookPictureService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private app: AppComponent,
    private afStorage: AngularFireStorage
  ) {
  }

  ngOnInit() {
    this.bookForm = this.fb.group({
      id: '',
      name: ['', [Validators.required, Validators.minLength(1)]],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0)]],
      authors: [''],
    });
    this.useFile = [];
    this.previewUrl = [];
    this.bookPictures = [];
    this.authors = [];
    this.languages = [];
    this.authorService.getAuthorList().subscribe(next => this.authorList = next);
    this.publishingService.getPublishingList().subscribe(next => this.publishingList = next);
    this.categoryService.getCategoryList().subscribe(next => this.categoryList = next);
    this.languageService.getLanguageList().subscribe(next => this.languageList = next);
    const id = +this.route.snapshot.paramMap.get('id');
    this.bookService.getBook(id).subscribe(
      next => {
        this.bookForm.patchValue(next);
        this.authors = next.authors;
        this.languages = next.languages;
        this.category = next.category;
        this.publishing = next.publishing;
        for (const picture of next.bookPictures) {
          this.previewUrl.push(picture.src);
        }
      }, error => {
        console.log(error);
        this.book = null;
      }
    );
  }

  onSubmit() {
    if (this.bookForm.valid) {
      const {value} = this.bookForm;
      this.book = value;
      for (const preview of this.previewUrl) {
        this.bookPictures.push({
          id: '',
          src: preview
        });
      }
      console.log(this.bookPictures);
      this.book.bookPictures = this.bookPictures;
      console.log(this.bookPictures);
      console.log(this.book.bookPictures);
      this.book.authors = this.authors;
      this.book.languages = this.languages;
      this.book.category = this.category;
      this.book.publishing = this.publishing;
      this.bookService.editBook(this.book).subscribe(next => {
        console.log(next);
        this.ngOnInit();
        this.message = true;
      });
    } else {
      console.log('error');
    }
  }

  onSelectFile(event) {
    this.useFile = [];
    this.useFile = event.srcElement.files;
    this.preview();
  }

  preview() {
    this.previewUrl = [];
    for (const file of this.useFile) {
      const id = Math.random().toString(36).substring(2);
      this.ref = this.afStorage.ref(id);
      this.task = this.ref.put(file);
      this.uploadProgress = this.task.percentageChanges();
      this.task.then(async url => {
        const downloadURL = await url.task.snapshot.ref.getDownloadURL();
        this.previewUrl.push(downloadURL);
      });
    }
  }

  addAuthor(id) {
    if (id != null && this.checkAuthor(id) === -1) {
      this.authorService.getAuthor(id).subscribe(next => this.authors.push(next));
    }
  }

  checkAuthor(id) {
    const checkId = [];
    for (const a of this.authors) {
      checkId.push(a.id);
    }
    return checkId.indexOf(+id);
  }

  addCategory(id) {
    this.category = null;
    this.categoryService.getCategory(id).subscribe(next => this.category = next);
  }

  addPublishing(id) {
    this.publishing = null;
    this.publishingService.getPublishing(id).subscribe(next => this.publishing = next);
  }

  addLanguage(id) {
    if (id != null && this.checkLanguage(id) === -1) {
      this.languageService.getLanguage(id).subscribe(next => this.languages.push(next));
    }
  }

  checkLanguage(id) {
    const checkId = [];
    for (const a of this.languages) {
      checkId.push(a.id);
    }
    return checkId.indexOf(+id);
  }

  searchAuthor(name) {
    this.authorService.findAllByNameContaining(name.value).subscribe(next => {
      this.authorList = next;
    }, error => {
      console.log(error);
    });
  }

  searchLanguages(name) {
    this.languageService.findAllByNameContaining(name.value).subscribe(next => {
      this.languageList = next;
    }, error => {
      console.log(error);
    });
  }

  searchCategory(name) {
    this.categoryService.findAllByNameContaining(name.value).subscribe(next => {
      this.categoryList = next;
    }, error => {
      console.log(error);
    });
  }

  searchPublishing(name) {
    this.publishingService.findAllByNameContaining(name.value).subscribe(next => {
      this.publishingList = next;
    }, error => {
      console.log(error);
    });
  }

  checkValid() {
    return !(this.bookForm.invalid
      || this.authors === []
      || this.languages === []
      || this.category === undefined
      || this.publishing === undefined
      || this.previewUrl === []);
  }
}
