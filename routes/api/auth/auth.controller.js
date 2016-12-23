'use strict';

const jwt = require('jsonwebtoken');

const Users = require('../../../models/users');

// 회원가입 라우터
exports.register = (req, res) => {
    const username = req.body.username;
    const password = req.body.username;
    let newUser  = null;

    // 사용자 추가 함수
    const create = (user) => {
        if ( user )
            throw new Error('username already exists');
        else
            return Users.create(username, password);
    };

    // 사용자가 있는지 확인하기 위해 사용자 수를 가져옴
    const count = (user) => {
        newUser = user;
        return Users.count({}).exec();
    };

    // count 가 1이면 할당
    const assign = (count) => {
        if ( count === 1 )
            return newUser.assignAdmin(); // mongoose methods admin 값을 true 로 변경
        else
            return Promise.resolve(false); // 프로미스
    };

    const respond = (isAdmin) => {
        res.json({
            message : 'Register Ok!',
            admin   : isAdmin ? true : false // !!isAdmin 으로 대체가능??
        });
    };

    const onError = (error) => {
        res.status(409).json({
            message : error.message
        });
    };


    Users.findOneByUsername(username)
    .then(create)
    .then(count)
    .then(assign)
    .then(respond)
    .catch(onError);
};

// 로그인 라우터
exports.login = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const secret = req.app.get('jwt-secret'); // app.js 에서 set 한 변수

    const check = (user) => {
        if ( !user ) {
            throw new Error('Login fail, no user'); // user 가 없는 경우
        }
        if ( !user.verify(password) ) { // verify() mongoose methods
            throw new Error('Login fail, password');
        }

        const promise = new Promise( (resolve, reject) => {
            jwt.sign( // payload, secret, options, [callback]
                {
                    _id      : user.id,
                    username : username,
                    admin    : user.admin
                },
                secret,
                {
                    expiresIn : '7d',
                    issuer    : 'ryan',
                    subject   : 'userInfo'
                },
                (err, token) => {
                    if (err) reject(err);
                    resolve(token);
                }
            );
        });
        return promise;
    };

    const respond = (token) => {
        res.json({
            message : 'loggin Ok!',
            token
        });
    };

    const onError = (error) => {
        res.status(403).json({
            message : error.message
        });
    };

    Users.findOneByUsername(username)
    .then(check)
    .then(respond)
    .catch(onError);
};