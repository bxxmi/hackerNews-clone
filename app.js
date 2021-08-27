// 📌 XMLHttpRequest 객체: 서버와 상호작용하기 위해 사용된다.
// 전체 페이지의 새로고침 없이 URL로부터 데이터를 받아올 수 있다.
// Ajax 프로그래밍에 주로 사용되는 객체이다.
const container = document.getElementById('root');
const ajax = new XMLHttpRequest();
const content = document.createElement('div');
const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';

// API 데이터 가져오는 함수
function getData(url) {
  ajax.open('GET', url, false); 
  ajax.send();

  return JSON.parse(ajax.response);
}

// 뉴스 목록 리스트 함수
function newsFeed() {
  const newsFeed = getData(NEWS_URL);
  const newsList = [];

  newsList.push('<ul>');

  for(let i = 0; i < 10; i++) {
    newsList.push(`
    <li>
      <a href="#${newsFeed[i].id}">
        ${newsFeed[i].title} (${newsFeed[i].comments_count}) 
      </a>
    </li>`);
  } 

  newsList.push('</ul>');
  container.innerHTML = newsList.join('');
}

// 뉴스 내용 함수
function newsDetail() {
  const id = location.hash.substr(1);
  const newsContent = getData(CONTENT_URL.replace('@id', id));

  container.innerHTML = `
  <h1>${newsContent.title}</h1>

  <div>
    <a href="#">목록</a>
  </div>
  `;
}

// 화면 전환 담당
function router() {
  const routePath = location.hash;

  if (routePath === '') {
    newsFeed();
  } else {
    newsDetail();
  }
}

window.addEventListener('hashchange', router);
router();
