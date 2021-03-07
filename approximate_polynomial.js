var X=[];
var Y=[];
var sample=[];
var title='';
var xLabel='';
var yLabel='';
var i,j;
var sheet_len;
var ctx;
var newChart;
var predict=0.1;
document.getElementById('input').addEventListener('change',function(event){
    var optimal_degree_on_HTML=document.getElementById('optimal_degree');
    optimal_degree_on_HTML.innerHTML='';
    var equation=document.getElementById('equation');
    equation.innerHTML='';
    var prediction=document.getElementById('prediction');
    prediction.innerHTML='';
    var oldDegree=document.getElementById('degree');
    oldDegree.value='';
    if(newChart){
        newChart.destroy();
        X=[];
        Y=[];
        sample=[];        
    }
    var files=event.target.files;
    var reader=new FileReader();
    reader.onload=function(event){              
        var data=new Uint8Array(event.target.result);
        var workbook=XLSX.read(data,{type: 'array'});        
        var Sheet1=workbook.Sheets['Sheet1'];
        xLabel=Sheet1['A1'].v;        
        yLabel=Sheet1['B1'].v;
        var sheet=XLSX.utils.sheet_to_json(Sheet1);
        sheet_len=sheet.length;
        for(let i=2;i<sheet_len+2;i++){
            var x=Sheet1['A'+i].v;
            var y=Sheet1['B'+i].v-2;
            X.push(x);
            Y.push(y);
            sample.push({x:x,y:y});
        }
        ctx=document.getElementById('canvas').getContext('2d');
        if(newChart){
            newChart.destroy()
        }
        newChart=new Chart(ctx,{
            type: 'scatter',
            data: {
                datasets:[
                {
                    label:'サンプルデータ',
                    data:sample,
                    backgroundColor: 'black',
                },
            ],
            },
            options:{
                title:{
                    display:true,
                    text: title,
                },
                scales:{
                    xAxes:[{
                        scaleLabel:{
                            display:true,
                            labelString:xLabel
                        },
                        ticks:{
                            stepSize:1
                        }
                    }],
                    yAxes:[{
                        scaleLabel:{
                            display:true,
                            labelString:yLabel
                        },
                    }]
                }
            }
        });            
    }
    reader.readAsArrayBuffer(files[0]);
})

var button2=document.getElementById('button2');
button2.addEventListener('click',function(event){
    var phi=[];
    var phi_t=[];
    var phi_t_multi_phi=[];
    var inverse_phi_t_multi_phi=[];
    var phi_t_multi_Y=[]; 
    var w=[];
    var degree=parseInt(document.getElementById('degree').value,10);
    if(!degree){
        window.alert('次数を入力してください');
        return;
    }
    for(i=0;i<sheet_len;i++){
        var phi_r=[];
        var a=X[i];
        phi_r.push(1);
        phi_r.push(a);
        for(j=2;j<=degree;j++){          
            a=a*X[i];
            phi_r.push(a);
        }
        phi.push(phi_r);
    }
    phi_t=transferMatrix(phi);
    phi_t_multi_phi=multiplyMatrix(phi_t,phi);
    inverse_phi_t_multi_phi=inverseMatrix(phi_t_multi_phi);   
    for(i=0;i<degree+1;i++){
        var a=0;
        for(j=0;j<sheet_len;j++){
            a=a+phi_t[i][j]*Y[j];
        } 
        phi_t_multi_Y.push(a);
    }
    for(i=0;i<degree+1;i++){
        var a=0;
        for(j=0;j<degree+1;j++){
            a=a+inverse_phi_t_multi_phi[i][j]*phi_t_multi_Y[j];
        } 
        w.push(a);
    }
    var data2=[];
    for(i=0;i<sheet_len+sheet_len*0.1;i++){
        var t=0;              
        for(j=0;j<=degree;j++){
            var a=1;
            for(var k=0;k<j;k++){
                a=a*i;
            }
            a=a*w[j];
            t=t+a;
        }
        data2.push({x:i,y:t});
    }
    var optimal_degree_on_HTML=document.getElementById('optimal_degree');
    optimal_degree_on_HTML.innerHTML='次数:'+degree;   
    var equation=document.getElementById('equation');
    var equation_letters='y='+w[0];
    for(j=1;j<=degree;j++){
        if(w[j]>=0){
            equation_letters=equation_letters+'+'+w[j]+'x^'+j;
        }else{
            equation_letters=equation_letters+w[j]+'x^'+j;
        }        
    }
    equation.innerHTML=equation_letters;
    var prediction=document.getElementById('prediction');
    var prediction_letters='<ul>';
    for(i=sheet_len;i<sheet_len+sheet_len*predict;i++){
        prediction_letters+='<li>予測値:x='+i+' y='+data2[i].y+'</li>';
    }
    prediction_letters+='</ul>';
    prediction.innerHTML=prediction_letters;
    if(newChart){
        newChart.destroy()
    }
    newChart=new Chart(ctx,{
        type: 'scatter',
        data: {
            datasets:[
            {
                label:'サンプルデータ',
                data:sample,
                backgroundColor: 'black',
            },
            {
                label:'近似曲線',
                data: data2,
                fill: false,
                showLine: true,
                borderColor: 'blue',
                backgroundColor: 'blue',
            }
        ],
        },
        options:{
            title:{
                display:true,
                text: title,
            },
            scales:{
                xAxes:[{
                    scaleLabel:{
                        display:true,
                        labelString:xLabel
                    },
                    ticks:{
                        stepSize:1
                    }
                }],
                yAxes:[{
                    scaleLabel:{
                        display:true,
                        labelString:yLabel
                    },
                }]
            }
        }
    });    
})

var button=document.getElementById('button');
button.addEventListener('click',function(event){   
    var optimal_degree=0;
    var ssr_min=Number.MAX_SAFE_INTEGER;
    var training_length=Math.floor(sheet_len*0.7);
    console.log('training length:'+training_length);
    for(var degree=0;degree<training_length;degree++){  
        var phi=[];
        var phi_t=[];
        var phi_t_multi_phi=[];
        var inverse_phi_t_multi_phi=[];
        var phi_t_multi_Y=[];
        var w=[];
        for(i=0;i<training_length;i++){
            var phi_r=[];
            var a=X[i];
            phi_r.push(1);
            phi_r.push(a);
            for(j=2;j<=degree;j++){          
                a=a*X[i];
                phi_r.push(a);
            }
            phi.push(phi_r);
        }
        phi_t=transferMatrix(phi);
        phi_t_multi_phi=multiplyMatrix(phi_t,phi);
        inverse_phi_t_multi_phi=inverseMatrix(phi_t_multi_phi);
        for(i=0;i<degree+1;i++){
            var a=0;
            for(j=0;j<training_length;j++){
                a=a+phi_t[i][j]*Y[j];
            } 
            phi_t_multi_Y.push(a);
        }
        for(i=0;i<degree+1;i++){
            var a=0;
            for(j=0;j<degree+1;j++){
                a=a+inverse_phi_t_multi_phi[i][j]*phi_t_multi_Y[j];
            } 
            w.push(a);
        }
        var ssr=0;
        for(i=training_length;i<sheet_len;i++){
            var t=0;              
            for(j=0;j<=degree;j++){
                var a=1;
                for(var k=0;k<j;k++){
                    a=a*i;
                }
                a=a*w[j];
                t=t+a;
            }
            var res=Y[i]-t;
            ssr=ssr+res*res;       
        }
        if(ssr_min>ssr){
            ssr_min=ssr;
            optimal_degree=degree;
        }
    }
    console.log('optimal degree='+optimal_degree);
    var phi=[];
    var phi_t=[];
    var phi_t_multi_phi=[];
    var inverse_phi_t_multi_phi=[];
    var phi_t_multi_Y=[];
    var w=[];
    for(i=0;i<sheet_len;i++){
        var phi_r=[];
        var a=X[i];
        phi_r.push(1);
        phi_r.push(a);
        for(j=2;j<=optimal_degree;j++){          
            a=a*X[i];
            phi_r.push(a);
        }
        phi.push(phi_r);
    }
    phi_t=transferMatrix(phi);
    phi_t_multi_phi=multiplyMatrix(phi_t,phi);
    inverse_phi_t_multi_phi=inverseMatrix(phi_t_multi_phi);
    for(i=0;i<optimal_degree+1;i++){
        var a=0;
        for(j=0;j<sheet_len;j++){
            a=a+phi_t[i][j]*Y[j];
        } 
        phi_t_multi_Y.push(a);
    }
    for(i=0;i<optimal_degree+1;i++){
        var a=0;
        for(j=0;j<optimal_degree+1;j++){
            a=a+inverse_phi_t_multi_phi[i][j]*phi_t_multi_Y[j];
        } 
        w.push(a);
    }    
    var data2=[];
    for(i=0;i<sheet_len+sheet_len*predict;i++){
        var t=0;              
        for(j=0;j<=optimal_degree;j++){
            var a=1;
            for(var k=0;k<j;k++){
                a=a*i;
            }
            a=a*w[j];
            t=t+a;
        }
        data2.push({x:i,y:t});
    }
    var optimal_degree_on_HTML=document.getElementById('optimal_degree');
    optimal_degree_on_HTML.innerHTML='最適次数:'+optimal_degree;   
    var equation=document.getElementById('equation');
    var equation_letters='近似式:y='+w[0];
    for(j=1;j<=optimal_degree;j++){
        if(w[j]>=0){
            equation_letters=equation_letters+'+'+w[j]+'x^'+j;
        }else{
            equation_letters=equation_letters+w[j]+'x^'+j;
        }        
    }
    equation.innerHTML=equation_letters;
    var prediction=document.getElementById('prediction');
    var prediction_letters='<ul>';
    for(i=sheet_len;i<sheet_len+sheet_len*predict;i++){
        prediction_letters+='<li>予測値:x='+i+' y='+data2[i].y+'</li>';
    }
    prediction_letters+='</ul>';
    prediction.innerHTML=prediction_letters;
    if(newChart){
        newChart.destroy()
    }
    newChart=new Chart(ctx,{
        type: 'scatter',
        data: {
            datasets:[
            {
                label:'サンプルデータ',
                data:sample,
                backgroundColor: 'black',
            },
            {
                label:'近似曲線',
                data: data2,
                fill: false,
                showLine: true,
                borderColor: 'blue',
                backgroundColor: 'blue',
            }
        ],
        },
        options:{
            title:{
                display:true,
                text: title,
            },
            scales:{
                xAxes:[{
                    scaleLabel:{
                        display:true,
                        labelString:xLabel
                    },
                    ticks:{
                        stepSize:1
                    }
                }],
                yAxes:[{
                    scaleLabel:{
                        display:true,
                        labelString:yLabel
                    },
                }]
            }
        }
    });    
})

function replaceRows(matrix){
    var row_len=matrix[0].length;
    var column_len=matrix.length;
    for(var i=0;i<=column_len-1;i++){
        if(matrix[i][i]==0){
            var temp=matrix[i].slice(0,row_len);
            var k=1;
            while(matrix[i][i]==0){
                if(matrix[i+k][i]!=0){
                    matrix[i]=matrix[i+1].slice(0,row_len);
                    matrix[i+k]=temp.slice(0,row_len);
                }
                k++;
            }
        }
    }
    return matrix;
}

function multiplyMatrix(A,B){
    var column_len=A.length;    
    var row_len=B.length;    
    if(A[0].length!=row_len){
        console.log("行数と列数が一致しません");
        console.log("column:"+A[0].length);
        console.log("row:"+row_len);
        return;      
    }
    var result=[];
    for(var i=0;i<column_len;i++){
        var result_r=[];            
        for(var k=0;k<column_len;k++){
            var a=0;
            for(var j=0;j<row_len;j++){
                a=a+A[i][j]*B[j][k];                
            }
            result_r.push(a);
        }
        result.push(result_r);         
    }
    return result;
}

function inverseMatrix(matrix){
    //Gauss-Jordan
    var i,j,k;
    var row_len=matrix.length;
    var inverse_matrix=[];
    for(i=0;i<row_len;i++){
        for(j=0;j<row_len;j++){
            if(i==j){
                matrix[i].push(1);
            }else{
                matrix[i].push(0);
            }
        }            
    }     
    matrix=replaceRows(matrix);        
    for(i=0;i<row_len;i++){
        var a=matrix[i][i];
        for(j=0;j<2*row_len;j++){
            matrix[i][j]=matrix[i][j]/a;             
        }
        for(k=0;k<i;k++){               
            var b=matrix[k][i];
            for(j=0;j<2*row_len;j++){
                matrix[k][j]=matrix[k][j]-b*matrix[i][j];
            }
        }
        for(k=i+1;k<row_len;k++){
            var b=matrix[k][i];
            for(j=0;j<2*row_len;j++){
                matrix[k][j]=matrix[k][j]-b*matrix[i][j];
            }               
        }
    }
    for(i=0;i<row_len;i++){
        var inverse_matrix_r=matrix[i].slice(row_len,2*row_len);
        inverse_matrix.push(inverse_matrix_r);
    }       
    return inverse_matrix;
}

function transferMatrix(A){
    var transfer_matrix=[];
    var row_len=A.length;
    var column_len=A[0].length;
    for(var i=0;i<column_len;i++){
        var transfer_matrix_r=[];
        for(var j=0;j<row_len;j++){                
            transfer_matrix_r.push(A[j][i]);                
        }   
        transfer_matrix.push(transfer_matrix_r);         
    }
    return transfer_matrix;
}