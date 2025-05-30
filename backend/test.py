import cv2
print(cv2.__version__)

img = cv2.imread("images/centro.jpg")

roi = cv2.selectROI("Select ROI", img, False)

cropped_img = img[int(roi[1]):int(roi[1]+roi[3]), int(roi[0]):int(roi[0]+roi[2])]

cv2.imwrite("Cropped.png", cropped_img)
cv2.imshow("Cropped image", cropped_img)
cv2.waitKey(0)
cv2.destroyAllWindows()