import java.io.File;
import java.util.HashMap;
import java.util.Map;

import org.geotools.data.DataStore;
import org.geotools.data.DataStoreFinder;
import org.geotools.data.FeatureSource;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.opengis.feature.Property;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.filter.Filter;

public class ShapeLoad {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		
		try {
			File file = new File("C:\\Users\\Administrator\\Downloads\\10tnvillage\\10_tn-village.shp");
	        Map<String, Object> map = new HashMap<>(); 
	        map.put("url", file.toURI().toURL());
	        
	        DataStore dataStore = DataStoreFinder.getDataStore(map);
	        
	        String typeName = dataStore.getTypeNames()[0];
	        
	        FeatureSource<SimpleFeatureType, SimpleFeature> source =
	                dataStore.getFeatureSource(typeName);
	        Filter filter = Filter.INCLUDE; // ECQL.toFilter("BBOX(THE_GEOM, 10,20,30,40)")
	
	        FeatureCollection<SimpleFeatureType, SimpleFeature> collection = source.getFeatures(filter);
	        try (FeatureIterator<SimpleFeature> features = collection.features()) {
	            while (features.hasNext()) {
	                SimpleFeature feature = features.next();
	                System.out.print(feature.getID());
	                System.out.print(": ");
	                
	                for (Property attribute : feature.getProperties()) {
	                    System.out.println("\t" + attribute.getName() + ":" + new String(attribute.getValue().toString().getBytes("x-windows-949"), "euc-kr"));
	                }
	                System.out.println(feature.getDefaultGeometryProperty().getValue());
	            }
	        }
		}catch (Exception e) {
			// TODO: handle exception
			e.printStackTrace();
		}
	}

}
