import i18n from 'i18next';
import app from './app.js';
import ru from './locales/ru.js';

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: 'false',
    resources: {
      ru,
    },
  }).then(app(i18nInstance));
};
