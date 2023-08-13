import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const paramsNotify = {
  position: 'center-center',
  timeout: 2000,
  width: '200px',
  fontSize: '24px',
};

let lightbox = new SimpleLightbox('.img_wrap a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const searchForm = document.querySelector('form');
const gallery = document.querySelector('.gallery');
const loadBtn = document.querySelector('.load-more');

searchForm.addEventListener('submit', handlerForm);

const perPage = 40;
let page = 1;

loadBtn.classList.add('is-hidden');

async function getPhoto(data, page, perPage) {
  const BASE_URL = 'https://pixabay.com/api/';
  const API_KEY = '38674668-fb5d0e9be0babef905868f38f';
  console.log(data);
  if (data) {
    const params = new URLSearchParams({
      key: API_KEY,
      q: data,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: 'true',
      page: page,
      per_page: perPage,
    });
    const resp = (await axios.get(`${BASE_URL}?${params}`)).data;
    console.log(resp);
    return resp;
  } else {
    return onFetchError();
  }
}

function handlerForm(evt) {
  evt.preventDefault();
  gallery.innerHTML = '';
  page = 1;
  if (evt.currentTarget.elements.searchQuery.value === '') {
    Notify.info('Enter your request, please!', paramsNotify);
    return;
  }
  const data = new FormData(evt.currentTarget)
    .get('searchQuery')
    .trim()
    .toLowerCase()
    .split(' ')
    .join('+');

  getPhoto(data, page, perPage)
    .then(resp => {
      const { hits, totalHits } = resp;
      console.log(hits);
      if (totalHits === 0) {
        Notify.failure(
          ('Sorry, there are no images matching your search query. Please try again.',
          paramsNotify)
        );
        return;
      } else {
        Notify.info(`Hooray! We found ${totalHits} images.`, paramsNotify);
        gallery.innerHTML = createMarkup(hits);
        lightbox.refresh();
      }
      if (totalHits > perPage) {
        loadBtn.classList.remove('is-hidden');
      }
    })
    .catch(onFetchError);

  loadBtn.addEventListener('click', onClickLoadMore);

  function onClickLoadMore() {
    gallery.innerHTML = '';
    page += 1;
    getPhoto(data, page, perPage)
      .then(resp => {
        const searchResults = resp.hits;
        console.log(searchResults);
        const numberOfPage = Math.ceil(resp.totalHits / perPage);
        gallery.innerHTML = createMarkup(searchResults);
        if (page === numberOfPage) {
          loadBtn.classList.add('is-hidden');
          Notify.info(
            "We're sorry, but you've reached the end of search results.",
            paramsNotify
          );
          loadBtn.removeEventListener('click', onClickLoadMore);
        }
        lightbox.refresh();
      })
      .catch(onFetchError);
  }
  evt.currentTarget.reset();
}

function createMarkup(arr) {
  return arr
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<div class="photo-card">
        <div class="img_wrap">
            <a class="gallery_link" href="${largeImageURL}">
                <img src="${webformatURL}" alt="${tags}" width="300" loading="lazy" />
            </a>
        </div>
        <div class="info">
            <p class="info-item">
            <b>Likes: ${likes}</b>
            </p>
            <p class="info-item">
            <b>Views: ${views}</b>
            </p>
            <p class="info-item">
            <b>Comments: ${comments}</b>
            </p>
            <p class="info-item">
            <b>Downloads: ${downloads}</b>
            </p>
        </div>
        </div>`
    )
    .join('');
}

function onFetchError() {
  Notify.failure(
    'Oops! Something went wrong! Try reloading the page or make another choice!',
    paramsNotify
  );
}
