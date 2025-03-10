// style調用
// global
import "../styles/global/global.css";
import "../styles/profile/layout.css";
import "../styles/global/header.css";
import "../styles/global/unlogined.css";
// index
import "../styles/index/banner.css";
import "../styles/index/board.css";
// profile
import "../styles/profile/teacher/memberSelector.css";
import "../styles/profile/teacher/teacherLayout.css";
import "../styles/profile/teacher/addCourse.css";
import "../styles/profile/teacher/myCourse.css";
import "../styles/profile/teacher/registerCourse.css";
import "../styles/profile/teacher/userProfile.css";
import "../styles/profile/teacher/deleteCourse.css";
import "../styles/profile/teacher/removeFromCourse.css";
import "../styles/profile/admin/removeUsers.css";
// course
import "../styles/course/course.css";
import "../styles/course/videoUpload.css";
import "../styles/course/qaPage.css";
import "../styles/course/msgBoard.css";
import "../styles/course/imageZoom.css";
import "../styles/course/showMoreQA.css";
import "../styles/course/showPublicQA.css";
// videoPlay
import "../styles/videoPlay/player.css";
//method的layout
import "../styles/method/completeInfo.css";
import "../styles/profile/teacher/preRegister.css";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
