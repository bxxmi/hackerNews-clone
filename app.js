// 📌 XMLHttpRequest 객체: 서버와 상호작용하기 위해 사용된다.
// 전체 페이지의 새로고침 없이 URL로부터 데이터를 받아올 수 있다.
// Ajax 프로그래밍에 주로 사용되는 객체이다.
const container = document.getElementById('root');
const ajax = new XMLHttpRequest();
const content = document.createElement('div');
const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id.json';

// open('데이터를 가져오는 방식: GET or POST', '가져올 데이터 주소', 비동기 통신 여부: true or false ...)
ajax.open('GET', NEWS_URL, false); 
// send() 함수: 실질적으로 데이터를 가져옴
ajax.send();

// 가져온 데이터는 response에 담김
// console.log(ajax.response);

// JSON.parse(): 응답 값 객체로 변환
// 📌 단, 객체로 변환이 가능한 것은 데이터 타입이 JSON일 경우이다. 
const newsFeed = JSON.parse(ajax.response);
const ul = document.createElement('ul');

// hashchange: 같은 페이지 안에서 id값이 변경되는 이벤트
window.addEventListener('hashchange', function() {
  // location: 주소와 관련된 다양한 정보 제공
  const id = location.hash.substr(1);
  
  ajax.open('GET', CONTENT_URL.replace('@id', id), false); 
  ajax.send();

  const newsContent = JSON.parse(ajax.response);
  const title = document.createElement('h1');

  title.innerHTML = newsContent.title;
  content.appendChild(title);

});

for(let i = 0; i < 10; i++) {
  const li  = document.createElement('li');
  const a = document.createElement('a');

  a.href = `#${newsFeed[i].id}`;
  a.innerHTML = `${newsFeed[i].title} (${newsFeed[i].comments_count})`;

  li.appendChild(a);
  ul.appendChild(li);
} 

container.appendChild(ul);
container.appendChild(content); 

