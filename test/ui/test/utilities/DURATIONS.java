package utilities;
public enum DURATIONS {
   
	
	FREEZE (3600000), // 1 hour. (used for debugging). 
	HIGH  (1000),  //calls constructor with value 3
    MED (400),  //calls constructor with value 2
    LOW   (200)   //calls constructor with value 1
    ; // semicolon needed when fields / methods follow


    private final int levelCode;

    private DURATIONS(int levelCode) {
        this.levelCode = levelCode;
    }
    
    public int value() {
    	
    	return this.levelCode;
    }
}