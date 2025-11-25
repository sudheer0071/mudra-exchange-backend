//import npm package
const
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

//import function
import config from './index';

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretOrKey;
opts.passReqToCallback = true

//import model
import { UserToken, Admin } from '../models';

export const usersAuth = (passport) => {
    passport.use("usersAuth",
        new JwtStrategy(opts, async function (req, jwt_payload, done) {
            try {
                this.getToken = ExtractJwt.fromHeader('authorization')
                this.token = this.getToken(req)
                let userDoc = await UserToken.findOne({ 'userId': jwt_payload._id, 'token': this.token }).populate({ path: "userId", select: "_id userid type email google2Fa status" })
                if (userDoc && userDoc.userId && userDoc.userId.status == 'verified') {
                    let data = {
                        id: userDoc.userId._id,
                        userId: userDoc.userId.userid,
                        type: userDoc.userId.type,
                        email: userDoc.userId.email,
                        google2Fa: userDoc.userId.google2Fa
                    }
                    return done(null, data);
                }
                return done(null, false)

            } catch (err) {
                return done(err, false)
            }
            // User.findById(jwt_payload._id, function (err, user) {
            //     if (err) { return done(err, false) }
            //     else if (user) {
            //         let data = {
            //             id: user._id,
            //         }
            //         return done(null, data);
            //     }
            //     return done(null, false)
            // })
        })
    )
}

export const adminAuth = (passport) => {
    passport.use("adminAuth",
        new JwtStrategy(opts, async function (req, jwt_payload, done) {
            Admin.findById(jwt_payload._id, function (err, user) {
                if (err) { return done(err, false) }
                else if (user) {
                    let data = {
                        id: user._id,
                    }
                    return done(null, data);
                }
                return done(null, false)
            })
        })
    )
}
