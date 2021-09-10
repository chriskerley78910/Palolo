package people_panel;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import _palolo.PageObjectModel;

public class PeoplePanel extends PageObjectModel {

	public PeoplePanel(WebDriver driver) {
		
		super(driver);
		
	}
	
	public WebElement getPeoplePanel() {
		
		return getById("people-holder");
	}


	
	
	public List<WebElement> getPersonRows() {
		
		return this.driver.findElements(By.className("person-row"));
	}

	
	public void click2ndPerson() {
		
		try {
			Thread.sleep(2000);
			this.getPersonRows().get(1).click();
		}
		catch(Exception e) {
			
		}
			
	}
	
	
	public WebElement getFocusBevel(WebElement e) {
		
		
		return e.findElement(By.className("focused-user-bevel"));
	}

}
