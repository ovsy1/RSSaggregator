import onChange from 'on-change';

const createRSSelementsContainer = (RSSEl, header) => {
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  const containerHeader = document.createElement('div');
  containerHeader.classList.add('card-body');
  const containerHeaderElement = document.createElement('h2');
  containerHeaderElement.classList.add('card-title', 'h4');
  containerHeaderElement.textContent = `${header}`;
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group', 'border-0', 'rounded-0');

  containerHeader.appendChild(containerHeaderElement);
  container.appendChild(containerHeader);
  container.append(ulElement);
  RSSEl.appendChild(container);

  return ulElement;
};

const showFeedsAndPosts = (feedsEl, postsEl, loadedFeeds, loadedPosts, readedPosts) => {
  feedsEl.innerHTML = '';
  postsEl.innerHTML = '';
  const ulFeedsContainer = createRSSelementsContainer(feedsEl, 'Фиды');
  const ulPostsContainer = createRSSelementsContainer(postsEl, 'Посты');

  const feeds = loadedFeeds.map(({ title, description }) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'border-0', 'border-end-0');

    const titleEl = document.createElement('h3');
    titleEl.classList.add('h6', 'm-0');
    titleEl.textContent = `${title}`;

    const descriptionEl = document.createElement('p');
    descriptionEl.classList.add('m-0', 'small', 'text-black-50');
    descriptionEl.textContent = `${description}`;

    liEl.append(titleEl);
    liEl.append(descriptionEl);

    return liEl;
  });

  ulFeedsContainer.prepend(...feeds);

  const posts = loadedPosts.map(({ URL, title, description }) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const aEl = document.createElement('a');
    aEl.classList.add('fw-bold');
    aEl.href = `${URL}`;
    aEl.setAttribute('target', '_blank');
    aEl.setAttribute('rel', 'noopener noreferrer');
    aEl.textContent = `${title}`;
    aEl.addEventListener('click', () => {
      if (!readedPosts.includes(aEl.href)) {
        readedPosts.push(aEl.href);
      }
      aEl.classList.remove('fw-bold');
      aEl.classList.add('fw-normal', 'link-secondary');
    });

    const btn = document.createElement('button');
    btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btn.setAttribute('data-id', '2');
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#modal');
    btn.textContent = 'Просмотр';
    btn.addEventListener('click', () => {
      if (!readedPosts.includes(URL)) {
        readedPosts.push(URL);
      }
      aEl.classList.remove('fw-bold');
      aEl.classList.add('fw-normal', 'link-secondary');

      const modalTitle = document.querySelector('h5.modal-title');
      const modalBody = document.querySelector('div.modal-body');
      const fullAtricleBtn = document.querySelector('a.full-article');

      modalTitle.textContent = `${title}`;
      modalBody.textContent = `${description}`;
      fullAtricleBtn.href = `${URL}`;
    });

    liEl.append(aEl);
    liEl.append(btn);

    return liEl;
  });

  ulPostsContainer.prepend(...posts);
};

const renderErrors = (elements, watchedState, i18n) => {
  const { form: { validation: { error } } } = watchedState;
  elements.feedbackEl.classList.replace('text-success', 'text-danger');
  elements.feedbackEl.textContent = i18n.t(`${error}`);
  elements.RSSinput.classList.add('is-invalid');
};

const handleProcessState = (elements, watchedState, i18n) => {
  const { form: { process: { state: processState } } } = watchedState;
  const {
    RSSinput, submitBtn, feedbackEl, RSSfeedsEl, RSSpostsEl,
  } = elements;

  const loadedFeeds = watchedState.loadedRSSfeeds.feeds;
  const loadedPosts = watchedState.loadedRSSfeeds.posts;
  const readedPosts = watchedState.UIstate.readedPostsURLs;

  switch (processState) {
    case 'loaded':
      RSSinput.value = ''; // elements.form.reset();
      RSSinput.focus();

      RSSinput.readOnly = false;
      submitBtn.disabled = false;
      feedbackEl.classList.replace('text-info', 'text-success');
      feedbackEl.textContent = i18n.t('feedbackMsg.processState.success');

      showFeedsAndPosts(RSSfeedsEl, RSSpostsEl, loadedFeeds, loadedPosts, readedPosts);
      break;

    case 'loading':
      RSSinput.readOnly = true;
      submitBtn.disabled = true;
      RSSinput.classList.remove('is-invalid');
      feedbackEl.classList.remove('text-danger', 'text-success');
      feedbackEl.classList.add('text-info');
      feedbackEl.textContent = i18n.t('feedbackMsg.processState.loading');
      break;

    case 'failed':
      RSSinput.readOnly = false;
      submitBtn.disabled = false;
      feedbackEl.classList.replace('text-info', 'text-danger');
      feedbackEl.textContent = i18n.t(watchedState.form.process.error);
      RSSinput.classList.add('is-invalid');
      break;

    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const createWatchedState = (state, elements, i18n) => {
  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'form.validation.error':
        renderErrors(elements, watchedState, i18n);
        break;

      case 'form.process.state':
        handleProcessState(elements, watchedState, i18n);
        break;

      default:
        break;
    }
  });

  return watchedState;
};

export { createWatchedState, handleProcessState };
