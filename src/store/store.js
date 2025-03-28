import { applyMiddleware, combineReducers, compose, createStore, } from 'redux';
import { PostsReducer, toggleMenu } from './reducers/PostsReducer';
import { thunk } from 'redux-thunk';
import { AuthReducer } from './reducers/AuthReducer';
import { orderReducer } from './reducers/OrderReducer';
import todoReducers from './reducers/Reducers';
import { dashboardReducer } from './reducers/DashboardReducer';

const middleware = applyMiddleware(thunk);

const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const reducers = combineReducers({
    sideMenu: toggleMenu,
    posts: PostsReducer,
    auth: AuthReducer,
    todoReducers,
    orderReducer,
    dashboard: dashboardReducer,
})

export const store = createStore(reducers, composeEnhancers(middleware));
