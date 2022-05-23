import onChange from 'on-change';

const modalHandler = (watchedState, id) => {
  watchedState.modalWindowPostId = id;
  watchedState.watchedPosts = watchedState.watchedPosts.add(id);
};

const closeModal = (watchedState) => {
  watchedState.modalWindowPostId = null;
};
const renderModal = (watchedState, i18nInstance, modalForm) => {
  const postId = watchedState.modalWindowPostId;

  const currentPost = watchedState.posts.filter((post) => post.id === postId)[0];
  const modalTitle = modalForm.querySelector('.modal-title');
  const modalDescription = modalForm.querySelector('.modal-body');
  const goToFullArticleButton = modalForm.querySelector('.full-article');
  const closeModalButton = modalForm.querySelector('[class="btn btn-secondary"]');
  const xCloseButton = modalForm.querySelector('[class="close"]');

  if (postId) {
    modalForm.classList.add('show');
    modalForm.setAttribute('style', 'padding-right: 17px; display: block;');
    modalTitle.textContent = currentPost.title;
    modalDescription.textContent = currentPost.description;
    goToFullArticleButton.innerHTML = i18nInstance.t('modal.readFull');
    goToFullArticleButton.setAttribute('href', currentPost.link);
    closeModalButton.innerHTML = i18nInstance.t('modal.close');
    closeModalButton.addEventListener('click', () => closeModal(watchedState));
    xCloseButton.addEventListener('click', () => closeModal(watchedState));
  } else {
    modalForm.classList.remove('show');
    modalForm.removeAttribute('style');
  }
};

const renderWatchedStatuses = (watchedState) => {
  watchedState.posts.forEach((post) => {
    if (watchedState.watchedPosts.has(post.id)) {
      const currentPost = document.querySelector(`[data-id="${post.id}"]`);
      currentPost.classList.remove('font-weight-bold');
      currentPost.classList.add('font-weight-normal');
    }
  });
};

const renderPosts = (watchedState, i18nInstance) => {
  const posts = document.querySelector('.posts');
  posts.innerHTML = '';
  if (posts.length === 0) {
    return;
  }
  const h2 = document.createElement('h2');
  h2.innerHTML = i18nInstance.t('posts');
  posts.append(h2);
  const ul = document.createElement('ul');
  ul.classList.add('list-group');
  watchedState.posts.forEach((post) => {
    const { title, link, id } = post;
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const a = document.createElement('a');
    a.setAttribute('href', `${link}`);
    a.classList.add('font-weight-bold');
    a.setAttribute('data-id', id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = title;
    li.append(a);
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', 'button');
    button.setAttribute('data-toggle', 'modal');
    button.setAttribute('data-target', 'modal');
    button.textContent = i18nInstance.t('watchButton');
    button.addEventListener('click', () => modalHandler(watchedState, id));
    li.append(button);
    ul.append(li);
  });
  posts.append(ul);
};

const renderFeeds = (state, i18nInstance) => {
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = '';
  if (feeds.length === 0) {
    return;
  }
  const h2 = document.createElement('h2');
  h2.textContent = i18nInstance.t('feeds');
  feeds.append(h2);
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'mb-5');
  state.feeds.forEach((feed) => {
    const feedTitle = feed.title;
    const feedDescription = feed.description;
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    const h3 = document.createElement('h3');
    h3.textContent = feedTitle;
    const p = document.createElement('p');
    p.textContent = feedDescription;
    li.append(h3, p);
    ul.append(li);
  });
  feeds.append(ul);
};

const renderErrors = (state, i18nInstance, feedback) => {
  if (state.form.error === null) {
    feedback.innerHTML = '';
  } else {
    feedback.innerHTML = i18nInstance.t(state.form.error);
  }
};

const renderForm = (state, formField, feedback) => {
  const { valid } = state.form;
  if (valid) {
    formField.classList.remove('is-invalid');
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
  } else {
    formField.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
  }
};

const processStateHandler = (i18nInstance, submitButton, feedback, state) => {
  const input = document.querySelector('input');
  switch (state.form.processState) {
    case 'failed':
      submitButton.disabled = false;
      input.removeAttribute('readonly');
      break;
    case 'filling':
      submitButton.disabled = false;
      break;
    case 'sending':
      submitButton.disabled = true;
      input.setAttribute('readonly', true);
      break;
    case 'finished':
      feedback.innerHTML = i18nInstance.t('feedback.successfullyLoaded');
      input.removeAttribute('readonly');
      submitButton.disabled = false;
      break;
    default:
      throw new Error(`Unknown state: ${state.form.processState}`);
  }
};

export default (state, i18nInstance, formField, submitButton, modalForm) => {
  const feedback = document.querySelector('.feedback');
  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'watchedPosts':
        renderWatchedStatuses(watchedState);
        break;
      case 'modalWindowPostId':
        renderModal(watchedState, i18nInstance, modalForm);
        break;
      case 'form.processState':
        processStateHandler(i18nInstance, submitButton, feedback, state);
        break;
      case 'form.valid':
        renderForm(state, formField, feedback);
        break;
      case 'form.error':
        renderErrors(state, i18nInstance, feedback);
        break;
      case 'feeds':
        renderFeeds(state, i18nInstance);
        break;
      case 'posts':
        renderPosts(watchedState, i18nInstance);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
