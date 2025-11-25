// import package
import twilio from 'twilio';

// import lib
import config from '../config';

const client = twilio(
    config.smsGateway.TWILIO_ACCOUT_SID,
    config.smsGateway.TWILIO_AUTH_TOKEN,
)

export const sentSms = async ({ to, body = '' }) => {
    try {
        await client.messages.create({
            from: config.smsGateway.TWILIO_PHONE_NUMBER,
            to,
            body
        })
        console.log("SMS Successfully")
        return {
            'smsStatus': true
        }
    }
    catch (err) {
        console.log("SMS Error", err.toString())
        return {
            'smsStatus': false
        }
    }
}