package auth;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class LoginPage extends AuthPage{
	
	
	public static String emailField = "email";
	
	public static String passwordField = "password-login";

	public static String errorText = "error_msg";
	
	public static String submitBtn = "login-btn";
	
	public static String emailCautionMark = "email-caution-mark";

	private static String passwordCautionMark = "login-password-caution-mark";
	
	
	
	
	public LoginPage(WebDriver driver) {
		
		super(driver);
	}
	
	
	
	public WebElement getEmailField() {
		
		
		return this.driver.findElement(By.id(LoginPage.emailField));
	}
	
	
	public WebElement getEmailCautionMark() {
		
		return this.driver.findElement(By.id(LoginPage.emailCautionMark));
	}
	
	



	public WebElement getPasswordField() {
		
		return this.driver.findElement(By.id(LoginPage.passwordField));
	}
	
	
	public WebElement getLoginBtn() {
		
		return this.driver.findElement(By.id("login-btn"));
	}


	public WebElement getErrorText() {
		
		
		return this.driver.findElement(By.id(LoginPage.errorText));
	}


	public WebElement getPasswordCautionMark() {
	
		return this.driver.findElement(By.id(LoginPage.passwordCautionMark));
	}



	public WebElement getBanner() {
		
		return getById("banner_holder");
	}
	
	
	
	public void loginUser() {
		
		
		this.getEmailField().clear();
		
		this.getPasswordField().clear();
		
		AuthDB.addActivatedTeacher1();
		
		this.getEmailField().sendKeys("chriskerley78910@gmail.com");
		
		this.getPasswordField().sendKeys("qweqwe123");
		
		this.getLoginBtn().click();
	}



	public WebElement getLoginPasswordCallout() {
		
		return this.getById("login-password-callout");
	}



	public WebElement getLoginPasswordErrorMsg() {
		
		return this.getById("login-password-error-msg");
	}



	
	
	

	
	
	

}
