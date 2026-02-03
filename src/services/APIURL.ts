// const URL_LINK = "https://be-bookshelf.onrender.com";
const URL_LINK = "https://api.zenly.id.vn";

// const URL_LINK = "http://localhost:3000";

// làm rối - RSA

const API = {
    books: `${URL_LINK}/books`,
    users: `${URL_LINK}/users`,
    ME: `${URL_LINK}/auth/me`,
    login: `${URL_LINK}/auth/login`,
    activities: `${URL_LINK}/activities`,
    read: `${URL_LINK}/activities/read`,
    favorites: `${URL_LINK}/activities/favorites`,
    random: `${URL_LINK}/books/suggest`,
    genres: `${URL_LINK}/genres`,
    series: `${URL_LINK}/series`,
    ratings: `${URL_LINK}/ratings`,
    comments: `${URL_LINK}/comments`,
    highlights: `${URL_LINK}/highlights`,
    verifyEmail: `${URL_LINK}/users/verifymail`,
    refresh: `${URL_LINK}/auth/refresh`,
    resetPassword: `${URL_LINK}/users/reset-password`,
    changePassword: `${URL_LINK}/users/changePassword`,
    logout: `${URL_LINK}/auth/logout`,
    hot: `${URL_LINK}/books/hot`,
    local: `${URL_LINK}`
}
export default API;