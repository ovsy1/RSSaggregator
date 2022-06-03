import * as yup from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import _ from 'lodash';
import parse from './parser.js';
import getProxyUrl from './proxyUrl.js';
import render from './render.js';
import ru from './locales/ru.js';

const app = (i18nInstance) => {
  const state = {
    form: {
      processState: 'loaded',
      errors: '',
    },
    feeds: [],
    posts: [],
    readPostsId: [],
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    urlInput: document.getElementById('url-input'),
    feedback: document.querySelector('.feedback'),
    button: document.querySelector('button[aria-label=add]'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modal: {
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      readButton: document.querySelector('.full-article'),
    },
  };

  const watchedState = onChange(state, render(state, i18nInstance, elements));
  const timerForUpdates = 5000;

  yup.setLocale({
    string: {
      url: 'notValidUrl',
    },
    mixed: {
      notOneOf: 'rssExistError',
      required: 'fieldRequired',
    },
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.form.processState = 'loading';

    const validateUrl = yup
      .string()
      .url()
      .notOneOf(watchedState.feeds.map((feed) => feed.url))
      .required();

    validateUrl.validate(url)
      .then(() => axios.get(getProxyUrl(url))
        .then((response) => {
          const { feed, posts } = parse(response, url);
          const postsWithId = posts.map((post) => ({ ...post, itemId: _.uniqueId('post_') }));
          watchedState.feeds.push(feed);
          watchedState.posts = [...postsWithId, ...state.posts];
          watchedState.form.processState = 'added';
        })
        .catch((err) => {
          watchedState.form.processState = 'failing';
          watchedState.form.errors = err.name;
        }))
      .catch((err) => {
        watchedState.form.processState = 'failing';
        watchedState.form.errors = err.errors;
      });
  });

  const contentUpdate = () => {
    setTimeout(() => {
      const promises = state.feeds.map(({ url }) => axios.get(getProxyUrl(url))
        .then((response) => {
          const { posts } = parse(response, url);
          const addedPostLinks = state.posts.map(({ itemLink }) => itemLink);
          const addNewPosts = posts.filter(({ itemLink }) => !addedPostLinks.includes(itemLink))
            .map((post) => ({ ...post, itemId: _.uniqueId('post_') }));
          watchedState.posts = [...addNewPosts, ...state.posts];
        }));
      const promise = Promise.all(promises);
      promise.then(() => setTimeout(contentUpdate, timerForUpdates));
    }, timerForUpdates);
  };
  contentUpdate();

  elements.posts.addEventListener('click', (e) => {
    const postID = e.target.dataset.id;
    watchedState.modalPostItemId = postID;
    watchedState.readPostsId.push(postID);
  });
};

const run = () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  }).then(() => app(i18nInstance));
};

export default run;
