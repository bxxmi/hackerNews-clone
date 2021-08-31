interface Store {
  currentPage: number;
  feeds: NewsFeed[];
}

interface News {
  readonly id: number;
  readonly time_ago: string;
  title: string;
  url: string;
  user: string;
  content: string;
}

interface NewsFeed extends News {
  comments_count: number;
  points: number;
  read?: boolean; // ?: optional type
}

interface NewsDetail extends News {
  comments: [];
}

interface NewsComment extends News {
  comments: NewsComment[];
  level: number;
}

// 📌 XMLHttpRequest 객체: 서버와 상호작용하기 위해 사용된다.
// 전체 페이지의 새로고침 없이 URL로부터 데이터를 받아올 수 있다.
// Ajax 프로그래밍에 주로 사용되는 객체이다.
const container: HTMLElement | null = document.getElementById('root');
const ajax: XMLHttpRequest = new XMLHttpRequest();
const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';
const store: Store = {
  currentPage: 1,
  feeds: [],
};

// API 데이터 가져오는 함수
function getData<AjaxResponse>(url: string): AjaxResponse {
  ajax.open('GET', url, false);
  ajax.send();

  return JSON.parse(ajax.response);
}

// mixin 기법을 사용하는 이유
// 타겟클래스에다가 베이스클래스의 기능들을 합성시키는 것 
// 1. 기존 extends 방식은 코드에 적시되어야하는 상속방법이다.
// 즉, 상속 관계를 바꾸고 싶다면 코드 전체를 바꿔야한다. (코드 유연성 부족)
// 2. 기존 class extends는 다중 상속을 지원하지 않는다.
function applyApiMixins(targetClass: any, baseClasses: any[]): void {
  baseClasses.forEach(baseClass => {
    Object.getOwnPropertyNames(baseClass.prototype).forEach(name => {
      const descriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, name);

      if (descriptor) {
        Object.defineProperty(targetClass.prototype, name, descriptor);
      }
    });
  }); 
}

class Api {

  getRequest<AjaxResponse>(url: string): AjaxResponse {
    const ajax = new XMLHttpRequest();
    ajax.open('GET', url, false);
    ajax.send();

    return JSON.parse(ajax.response);
  }
}

class NewsFeedApi {
  getData(): NewsFeed[] {
    return this.getRequest<NewsFeed[]>(NEWS_URL);
  }
}

class NewsDetailApi {
  getData(id: string): NewsDetail {
    return this.getRequest<NewsDetail>(CONTENT_URL.replace('@id', id));
  }
}

interface NewsFeedApi extends Api {};
interface NewsDetailApi extends Api {};

applyApiMixins(NewsFeedApi, [Api]);
applyApiMixins(NewsDetailApi, [Api]);

// 글 읽음 처리 함수
function makeFeeds(feeds: NewsFeed[]): NewsFeed[] {
  for (let i = 0; i < feeds.length; i++) {
    feeds[i].read = false;
  }

  return feeds;
}

// 타입 가드(=null chk)
// 리턴 값이 없을 때는 void 사용
function updateView(html: string): void {
  if(container) {
    container.innerHTML = html;
  } else {
    console.error('최상위 컨테이너가 없어서 UI를 진행하지 못합니다.');
  }
}

// 뉴스 목록 리스트 함수
function newsFeed(): void {
  const api = new NewsFeedApi();
  let newsFeed: NewsFeed[] = store.feeds;
  const newsList = [];
  let template = `
  <div class="bg-gray-600 min-h-screen">
    <div class="bg-white text-xl">
      <div class="mx-auto px-4">
        <div class="flex justify-between items-center py-6">
          <div class="flex justify-start">
            <h1 class="font-extrabold">Hacker News</h1>
          </div>
          <div class="items-center justify-end">
            <a href="#/page/{{__prev_page__}}" class="text-gray-500">
              Previous
            </a>
            <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">
              Next
            </a>
          </div>
        </div> 
      </div>
    </div>
    <div class="p-4 text-2xl text-gray-700">
      {{__news_feed__}}        
    </div>
  </div>
  `;

  if (newsFeed.length === 0) {
    newsFeed = store.feeds = makeFeeds(api.getData());
  }

  for(let i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++) {
    newsList.push(`
    <div class="p-6 ${newsFeed[i].read ? 'bg-red-500' : 'bg-white'} mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
    <div class="flex">
      <div class="flex-auto">
        <a href="#/show/${newsFeed[i].id}">${newsFeed[i].title}</a>  
      </div>
      <div class="text-center text-sm">
        <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${newsFeed[i].comments_count}</div>
      </div>
    </div>
    <div class="flex mt-3">
      <div class="grid grid-cols-3 text-sm text-gray-500">
        <div><i class="fas fa-user mr-1"></i>${newsFeed[i].user}</div>
        <div><i class="fas fa-heart mr-1"></i>${newsFeed[i].points}</div>
        <div><i class="far fa-clock mr-1"></i>${newsFeed[i].time_ago}</div>
      </div>  
    </div>
  </div>
    `);
  } 

  template = template.replace('{{__news_feed__}}', newsList.join(''));
  template = template.replace('{{__prev_page__}}', String(store.currentPage > 1 ? store.currentPage - 1 : 1));
  template = template.replace('{{__next_page__}}', String(store.currentPage + 1));

  updateView(template);
}

// 뉴스 내용 함수
function newsDetail(): void {
  const api = new NewsDetailApi();
  const id = location.hash.substr(7);
  const newsDetail: NewsDetail = api.getData(id);
  let template = `
  <div class="bg-gray-600 min-h-screen pb-8">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="items-center justify-end">
              <a href="#/page/${store.currentPage}" class="text-gray-500">
                <i class="fa fa-times"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="h-full border rounded-xl bg-white m-6 p-4 ">
        <h2>${newsDetail.title}</h2>
        <div class="text-gray-400 h-20">
          ${newsDetail.content}
        </div>

        {{__comments__}}

      </div>
    </div>
  `;

  for(let i = 0; i < store.feeds.length; i++) {
    if(store.feeds[i].id === Number(id)) {
      store.feeds[i].read = true;
      break;
    }
  }
  updateView(template.replace('{{__comments__}}', makeComment(newsDetail.comments)));
}

function makeComment(comments: NewsComment[]): string {
    const commentString = [];

    for(let i = 0; i < comments.length; i++) {
      const comment: NewsComment = comments[i];
      commentString.push(`
      <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
          <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comment.user}</strong> ${comment.time_ago}
          </div>
          <p class="text-gray-700">${comment.content}</p>
        </div>      
      `)

      // 재귀 호출
      if (comment.comments.length > 0) {
        commentString.push(makeComment(comment.comments));
      }
    }
    return commentString.join('');
  }

// 화면 전환 담당
function router(): void {
  const routePath = location.hash;

  if (routePath === '') {
    newsFeed();
  } else if (routePath.indexOf('#/page/') >= 0) {
    store.currentPage = Number(routePath.substr(7));
    newsFeed();
  } else {
    newsDetail();
  }
}

window.addEventListener('hashchange', router);
router();
