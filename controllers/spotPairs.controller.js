const spotpairs = require('../../models/spotpairs');

router.post('/pair-add', (req, res) => {
    // const {
    //   errors,
    //   isValid
    // } = validateUpdatepairInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }


          const newcontract = new spotpairs({
            firstCurrencyId: req.body.firstCurrencyId,
            firstCurrencySymbol: req.body.firstCurrencySymbol,
            firstFloatDigit: req.body.firstFloatDigit,
            secondCurrencyId: req.body.secondCurrencyId,
            secondCurrencySymbol: req.body.secondCurrencySymbol,
            secondFloatDigit: req.body.secondFloatDigit,
            minPricePercentage: req.body.minPricePercentage,
            maxPricePercentage: req.body.maxPricePercentage,
            maxQuantity: req.body.maxQuantity,
            minQuantity: req.body.minQuantity,
            maker_rebate: req.body.maker_rebate,
            taker_fees: req.body.taker_fees,

          });
          newcontract
            .save();
              return res.status(200).json({
                message: 'Pair added successfully. Refreshing data...'
              })
            .catch(err => console.log(err));
      
    });

  