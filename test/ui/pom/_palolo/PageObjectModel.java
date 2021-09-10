package _palolo;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.html5.LocalStorage;
import org.openqa.selenium.html5.WebStorage;
import org.openqa.selenium.remote.Augmenter;

public abstract class PageObjectModel {
	
	
	protected WebDriver driver;
	
	

	
	public PageObjectModel(WebDriver driver) {

		this.driver = driver;
	}
	
	
	public void refresh() {
		
		driver.navigate().refresh();
	}
	
	
	public void clearLocalStorage() {
		WebStorage webStorage = (WebStorage) new Augmenter().augment(driver);
		LocalStorage localStorage = webStorage.getLocalStorage();
		localStorage.clear();
	}
	
	
	public void close() {
		
		this.driver.close();
	}

	
	public WebElement getById(String id) {
		
		return this.driver.findElement(By.id(id));
	}
	
	
	public static String getProjectPath() {
		
		return "/var/www/palolo";
	}
	
	

}
