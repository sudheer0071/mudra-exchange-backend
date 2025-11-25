// import package
import axios from 'axios'

// import config
import config from '../config';

export const checkToken = async (token) => {
    try {
        let respData = await axios({
            'url': `https://www.google.com/recaptcha/api/siteverify`,
            'method': 'post',
            'params': {
                'secret': config.RECAPTCHA_SECRET_KEY,
                'response': token
            }
        })

        if (respData && respData.status == 200 && respData.data.success == true) {
            return {
                status: true,
            }
        }
        console.log("  ERRORR IN RECAPTCHA...////// ", respData.data)
        return {
            status: false,
            message: "Invalid ReCaptcha"
        }
    } catch (err) {
        console.log(" (catch) ERRORR IN RECAPTCHA...////// ", err)
        return {
            status: false,
            message: "Invalid ReCaptcha"
        }
    }
}