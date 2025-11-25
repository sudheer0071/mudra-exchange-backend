import isEmpty from "../lib/isEmpty";

export const blogAdd = (req, res, next) => {
  let errors = {},
    reqBody = req.body,
    reqFile = req.files;
  console.log(
    reqBody,
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    reqFile,
    "gggggggggggggggggggggg"
  );
  let allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
  let slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  // if (isEmpty(reqBody.meta_title)) {
  //     errors.meta_titleErr = "Meta Title field is required";
  // }
  // if (isEmpty(reqBody.meta_description)) {
  //     errors.meta_descriptionErr = "Meta Description field is required";
  // }
  // if (isEmpty(reqBody.meta_keywords)) {
  //     errors.meta_keywordsErr = "Meta Keywords field is required";
  // }
  if (isEmpty(reqBody.author)) {
      errors.author = "Author field is required";
  }
  if (isEmpty(reqBody.title) || reqBody.title == "undefined") {
    errors.title = "Title field is required";
  }
  if (
    isEmpty(reqBody.maincategoryId) ||
    reqBody.articledetails == "undefined"
  ) {
    errors.categoryErr = "Category field is required";
  }
  if (isEmpty(reqBody.content) || reqBody.content == "undefined") {
    errors.contentErr = "Content field is required";
  }
  if (isEmpty(reqBody.slug)) {
    errors.slug = "Slug field is required";
  } else if (!slugRegex.test(reqBody.slug)) {
    errors.slug = "Slug is invalid";
  }
  // if (isEmpty(reqBody.blog_category)) {
  //     errors.blog_categoryErr = "Category field is required";
  // }

  //   if (reqFile.file[0] == undefined) {
  //     errors.imageErr = "Image field is required";
  //   } else if (!allowedExtensions.exec(reqFile.file[0].originalname)) {
  //     errors.imageErr =
  //       "Please upload file having extensions .jpeg/.jpg/.png/.gif/.webp only.";
  //   }
  console.log(errors, "rrrrrrrrrrrrrrrrrrrrrrr");
  if (!isEmpty(errors)) {
    return res.status(400).json({ status: false, errors: errors });
  }

  return next();
};

export const blogEdit = (req, res, next) => {
  let errors = {},
    reqBody = req.body,
    reqFile = req.file;
  let allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
  // if (isEmpty(reqBody.meta_title)) {
  //     errors.meta_titleErr = "Meta Title field is required";
  // }
  // if (isEmpty(reqBody.meta_description)) {
  //     errors.meta_descriptionErr = "Meta Description field is required";
  // }
  // if (isEmpty(reqBody.meta_keywords)) {
  //     errors.meta_keywordsErr = "Meta Keywords field is required";
  // }
  // if (isEmpty(reqBody.author)) {
  //     errors.authorErr = "Author field is required";
  // }
  // if (isEmpty(reqBody.title)) {
  //     errors.titleErr = "Title field is required";
  // }
  if (isEmpty(reqBody.content)) {
    errors.contentErr = "Content field is required";
  }
  // if (isEmpty(reqBody.slug)) {
  //     errors.slugErr = "Slug field is required";
  // }
  if (isEmpty(reqBody.blog_category)) {
    errors.blog_categoryErr = "Category field is required";
  }

  if (reqFile) {
    if (!allowedExtensions.exec(req.file.originalname)) {
      errors.imageErr =
        "Please upload file having extensions .jpeg/.jpg/.png/.gif/.webp only.";
    }
  }

  if (!isEmpty(errors)) {
    return res.status(200).json({ status: false, errors: errors });
  }

  return next();
};

export const categoryAdd = (req, res, next) => {
  let errors = {},
    reqBody = req.body;

  console.log(reqBody, "ddddddd");
  if (isEmpty(reqBody.categoryName)) {
    errors.categoryNameerr = "CategoryName field is required";
  }

  if (isEmpty(reqBody.slug)) {
    errors.slugerr = "Slug field is required";
  }
  console.log(errors, "ss");
  if (!isEmpty(errors)) {
    return res.status(400).json({ status: false, errors: errors });
  }

  return next();
};

export const newsletteradd = (req, res, next) => {
  let errors = {},
    reqBody = req.body;

  console.log(reqBody, "ddddddd");
  if (isEmpty(reqBody.name)) {
    errors.name = "Name field is required";
  }

  let emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;

  if (isEmpty(reqBody.email)) {
    errors.email = "Email field is required";
  } else if (!emailRegex.test(reqBody.email)) {
    errors.email = "Email is invalid";
  }

  if (!isEmpty(errors)) {
    return res.status(400).json({ errors: errors });
  }

  return next();
};
