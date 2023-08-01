module.exports = {
  GET: 'visitExamPaperList',
  record: {
    question: {
      GET: 'viewQuestionRecord',
    },
    paper: {
      GET: 'viewPaperRecord',
    },
  },
  categories: {
    POST: 'addExamsCategory',
    editor: {
      GET: 'visitEditCategory',
    },
  },
  category: {
    PARAMETER: {
      PUT: 'modifyExamsCategory',
    },
  },
  auth: {
    GET: 'visitExamsQuestionAuth',
    POST: 'submitExamsQuestionAuth',
  },
  paper: {
    GET: 'getExamsPaper',
    PARAMETER: {
      GET: 'getExamsPaper',
      POST: 'postExamsPaper',
    },
  },
  question: {
    POST: 'postQuestion',
    PARAMETER: {
      PUT: 'modifyQuestion',
      DELETE: 'removeQuestion',
      disabled: {
        DELETE: 'enabledQuestion',
        POST: 'disabledQuestion',
      },
      image: {
        GET: 'getQuestionImage',
      },
      auth: {
        PUT: 'modifyQuestionAuthStatus',
      },
    },
  },
  questions: {
    GET: 'visitExamQuestionManagement',
  },
  editor: {
    GET: 'visitEditQuestion',
  },
};
