// const URL_LINK = "https://be-bookshelf.onrender.com";

const URL_LINK = "http://localhost:3000";

// làm rối - RSA

const API = {
    books: `${URL_LINK}/books`,
    users: `${URL_LINK}/users`,
    profile: `${URL_LINK}/profile`,
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

    local: `${URL_LINK}`
}
export default API;