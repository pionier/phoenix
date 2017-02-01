var fDWL = fDWL||{};


//------------------------------------------------------------------
// Demi4D Library
//------------------------------------------------------------------
fDWL.namespace = function(ns_string){
	var	parts = ns_string.split('.'),
		parent = fDWL,
		idx;

	if( parts[0] === "fDWL" ){
		parts = parts.slice(1);
	}

	for( idx = 0; idx < parts.length; ++idx ){
		if( typeof parent[ parts[idx] ] === 'undefined' ){
			parent[ parts[idx] ] = {};
		}
		parent = parent[ parts[idx] ];
	}
	return parent;
};

//==================================================================
//	NameSpace:	fDWL.R4D
//==================================================================
fDWL.namespace( 'fDWL.R4D' );
//fDWL.D4D = {};



//==================================================================
//	NameSpace:	fDWL.D4D
//==================================================================
fDWL.namespace( 'fDWL.D4D' );
//fDWL.D4D = {};


//==================================================================
// TriangleBuffer
// 三角形バッファの生成
//------------------------------------------------------------------
//
//
//==================================================================
fDWL.R4D.TriangleBuffer = function( gl, vtxNum ){
	this.gl = gl;
	this.vtxNum = vtxNum;
	this.triangleVertexBuffer = gl.createBuffer();
	
	this.vertexSizeInByte = 2*3*Float32Array.BYTES_PER_ELEMENT + 4*Uint8Array.BYTES_PER_ELEMENT;	// vertex + normal
	this.vetexSizeInFloats = this.vertexSizeInByte / Float32Array.BYTES_PER_ELEMENT;

	this.positionOffsetInFloats = 0;		// Position Counter
	this.colorOffsetInBytes = 24;			// Color position Counter
	this.numberOfItems = 0;
};

fDWL.R4D.TriangleBuffer.prototype = {
	
	// Use Program
	useProgram: function( shader ){
		var gl = this.gl;
		gl.bindBuffer( gl.ARRAY_BUFFER, this.triangleVertexBuffer );
		gl.vertexAttribPointer( shader.attrLoc[0], shader.attrStride[0], gl.FLOAT, false, 28, 0 );
		gl.vertexAttribPointer( shader.attrLoc[1], shader.attrStride[1], gl.FLOAT, false, 28, 12 );
		gl.vertexAttribPointer( shader.attrLoc[2], shader.attrStride[2], gl.UNSIGNED_BYTE, true, 28, 24 );
		
		gl.useProgram( shader.prg );
	},
	useProgramDepth: function( shader ){
		var gl = this.gl;
		gl.bindBuffer( gl.ARRAY_BUFFER, this.triangleVertexBuffer );
		gl.vertexAttribPointer( shader.attrLoc[0], shader.attrStride[0], gl.FLOAT, false, 28, 0 );
		
		gl.useProgram( shader.prg );
	},
	// initialize
	initialize: function( shader ){
		var gl = this.gl;
		this.itrLvdBuffer = new ArrayBuffer( this.vtxNum * this.vertexSizeInByte );
		this.positionView = new Float32Array( this.itrLvdBuffer );
		this.colorView = new Uint8Array( this.itrLvdBuffer );
		
		this.numberOfItems = 0;					// Number of Vertex to draw
		this.positionOffsetInFloats = 0;		// Position Counter
		this.colorOffsetInBytes = 24;			// Color position Counter
	},
	
	// 三角形を描画バッファに登録
	setTriangle: function( vtx0, vtx1, vtx2  ){
		var pV = this.positionView,
			cV = this.colorView,
			pOffs = this.positionOffsetInFloats,
			cOffs = this.colorOffsetInBytes,
			vtx = [ vtx0, vtx1, vtx2 ],
			cnt = 0;
		
		for( cnt = 0; cnt < 3; ++cnt ){
			
			pV[pOffs  ] = vtx[cnt][0];
			pV[pOffs+1] = vtx[cnt][1];
			pV[pOffs+2] = vtx[cnt][2];
			pV[pOffs+3] = vtx[cnt][3];
			pV[pOffs+4] = vtx[cnt][4];
			pV[pOffs+5] = vtx[cnt][5];
			cV[cOffs  ] = vtx[cnt][6];
			cV[cOffs+1] = vtx[cnt][7];
			cV[cOffs+2] = vtx[cnt][8];
			cV[cOffs+3] = vtx[cnt][9];
			
			pOffs += this.vetexSizeInFloats;
			cOffs += this.vertexSizeInByte;
		}
		this.numberOfItems += 3;
		this.positionOffsetInFloats = pOffs;
		this.colorOffsetInBytes = cOffs;
	},
	
	draw: function(){
		if( this.numberOfItems != 0 ){
			this.gl.bufferData( this.gl.ARRAY_BUFFER, this.itrLvdBuffer, this.gl.STATIC_DRAW );
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.triangleVertexBuffer );
			this.gl.drawArrays( this.gl.TRIANGLES, 0, this.numberOfItems );
		}
	}
};


//==================================================================
// Matrix4
// ４次行列を生成
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 16個
//	Cube4:											// 立方体8個、インデックス形式
//
//==================================================================
fDWL.R4D.Matrix4 = function(){
	this.aa = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0
	];
};

fDWL.R4D.Matrix4.prototype = {
	//------------------------------------------------------------------
	//	和
	//------------------------------------------------------------------
	add: function( rMtx ){
		var idx = 0;
		for( idx = 0; idx < 16; ++idx ){
			this.aa[idx] += rMtx[idx];
		}
		return this;
	},
	//------------------------------------------------------------------
	//	積
	//------------------------------------------------------------------
	mul: function( rMtx ){
		var idx = 0,
			clm = 0,
			row = 0,
			tmpMtx = [];
		
		for( idx = 0; idx < 16; ++idx ){
			row = Math.floor(idx/4)*4;
			clm = idx%4;
			
			tmpMtx[idx] = this.aa[row+0]*rMtx.aa[clm+0] + this.aa[row+1]*rMtx.aa[clm+4] +
								this.aa[row+2]*rMtx.aa[clm+8] +this.aa[row+3]*rMtx.aa[clm+12];
		}
		for( idx = 0; idx < 16; ++idx ){
			this.aa[idx] = tmpMtx[idx];
		}
		return this;
	},
	//------------------------------------------------------------------
	//	スケール行列生成
	//------------------------------------------------------------------
	makeScale: function( scale ){
		this.aa = [
			scale[0],      0.0,      0.0,      0.0,
			     0.0, scale[1],      0.0,      0.0,
			     0.0,      0.0, scale[2],      0.0,
			     0.0,      0.0,      0.0, scale[3]
		];
		return this;
	},
	//------------------------------------------------------------------
	//	回転行列生成
	//------------------------------------------------------------------
	makeRot: function( axis, angle ){
		var sinX = Math.sin(angle),
			cosX = Math.cos(angle);
		
		this.aa = [
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0
		];
		switch( axis ){
		case 0:		// XY
			this.aa[0] = this.aa[5] = cosX;
			this.aa[1] = -sinX;
			this.aa[4] = sinX;
			break;
		case 1:		// YZ
			this.aa[5] = this.aa[10] = cosX;
			this.aa[6] = -sinX;
			this.aa[9] = sinX;
			break;
		case 2:		// YH
			this.aa[5] = this.aa[15] = cosX;
			this.aa[7] = -sinX;
			this.aa[13] = sinX;
			break;
		case 3:		// ZH
			this.aa[10] = this.aa[15] = cosX;
			this.aa[11] = -sinX;
			this.aa[14] = sinX;
			break;
		case 4:		// XH
			this.aa[0] = this.aa[15] = cosX;
			this.aa[3] = -sinX;
			this.aa[12] = sinX;
			break;
		case 5:		// XZ
			this.aa[0] = this.aa[10] = cosX;
			this.aa[2] = -sinX;
			this.aa[8] = sinX;
			break;
		default:
			break;
		}
		return this;
	},
	//------------------------------------------------------------------
	//	ベクトルとの積
	//------------------------------------------------------------------
	mulVec:	function( x, y, z, h ){
		var
		xx = this.aa[ 0]*x + this.aa[ 1]*y + this.aa[ 2]*z + this.aa[ 3]*h;
		yy = this.aa[ 4]*x + this.aa[ 5]*y + this.aa[ 6]*z + this.aa[ 7]*h;
		zz = this.aa[ 8]*x + this.aa[ 9]*y + this.aa[10]*z + this.aa[11]*h;
		hh = this.aa[12]*x + this.aa[13]*y + this.aa[14]*z + this.aa[15]*h;
		return [ xx, yy, zz, hh ];
	}
};

//==================================================================
// affine4D
// ４次元アフィン変換
//------------------------------------------------------------------
//
//	src:		// 頂点、( x, y, z, h )x数
//	rotate:		// ローカル座標系での回転
//	offs:		// ローカス座標系での位置オフセット
//	scale:		// 各方向のスケール、省略時は全要素1
//
//==================================================================
fDWL.R4D.affine4D = function( src, rotate, offs, scale ){
	var mx4Scale = new fDWL.R4D.Matrix4(),
		mx4Rotate,
		mx4Rots = [
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4()
		],
		vec4 = [ 0.0, 0.0, 0.0, 0.0 ]
		dst = [];
	
	// 各Matrixの生成
	if( scale === undefined ){
		scale = [ 1,1,1,1 ];
	}
	mx4Scale.makeScale( scale );
	for( idx = 0; idx < 6; ++idx ){
		mx4Rots[idx].makeRot( idx, rotate[idx]);
	}
	// 各Matrixの合成
	mx4Rotate = mx4Scale.
			mul( mx4Rots[0] ).
			mul( mx4Rots[1] ).
			mul( mx4Rots[2] ).
			mul( mx4Rots[3] ).
			mul( mx4Rots[4] ).
			mul( mx4Rots[5] );
	
	// 各頂点のaffine変換
	for( idx = 0; idx < src.length; idx += 4 ){
		vec4 = mx4Rotate.mulVec( src[idx], src[idx+1], src[idx+2], src[idx+3] );
		dst.push( vec4[0]+offs[0], vec4[1]+offs[1], vec4[2]+offs[2], vec4[3]+offs[3] );
	}
	
	return dst;
};
/**/

//==================================================================
// inProd4D
// 四次元ベクトルの内積を計算
//------------------------------------------------------------------
//------------------------------------------------------------------
fDWL.inProd4D = function( vec0, vec1 ){
	return ( vec0[0]*vec1[0] + vec0[1]*vec1[1] + vec0[2]*vec1[2] + vec0[3]*vec1[3] );
}

//==================================================================
// calcNormal4D
// 四面体の法線を計算
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 4個
//	center:											// 四面体の属する図形の重心
//
//==================================================================
fDWL.R4D.calcNormal4D = function( vertice, center ){
	var nor4D = [ 0,0,0,0 ],
		v0 = [ vertice[ 4]-vertice[0], vertice[ 5]-vertice[1], vertice[ 6]-vertice[2], vertice[ 7]-vertice[3] ],
		v1 = [ vertice[ 8]-vertice[0], vertice[ 9]-vertice[1], vertice[10]-vertice[2], vertice[11]-vertice[3] ],
		v2 = [ vertice[12]-vertice[0], vertice[13]-vertice[1], vertice[14]-vertice[2], vertice[15]-vertice[3] ],
		vec0 = [], vec1 = [], vec2 = [],
		vc0  = [], vc1  = [], vc2  = [],
		isEnd = false,
		sign = 0,
		tmp0, tmp1, tmp2,
		idx = 0;
	
	// 前処理：体に垂直なケースを取り除く
	for( idx = 0; idx < 4; ++idx ){
		if(( v0[idx] == 0 )&&( v1[idx] == 0 )&&( v2[idx] == 0 )){
			nor4D[idx] = 1.0;
			isEnd = true;
			break;
		}
	}
	// 本処理：ガウス・ジョルダン法
	while( !isEnd ){
		// X座標のピボットを得る
		tmp0 = Math.abs( v0[0] ), tmp1 = Math.abs( v1[0] ), tmp2 = Math.abs( v2[0] );
		// ベクトルの並び替え
		if( tmp0 >= tmp1 ){
			if( tmp1 >= tmp2 ){
				// tmp0 >= tmp1 >= tmp2
				vec0 = v0, vec1 = v1, vec2 = v2;
			}else
			if( tmp0 >= tmp2 ){
				// tmp0 >= tmp2 >= tmp1
				vec0 = v0, vec1 = v2, vec2 = v1;
			}else{
				// tmp2 >= tmp0 >= tmp1
				vec0 = v1, vec1 = v2, vec2 = v0;
			}
		}else{
			if( tmp2 >= tmp1 ){
				// tmp0 >= tmp1 >= tmp2
				vec0 = v2, vec1 = v1, vec2 = v0;
			}else
			if( tmp0 >= tmp2 ){
				// tmp0 >= tmp2 >= tmp1
				vec0 = v0, vec1 = v2, vec2 = v1;
			}else{
				// tmp2 >= tmp0 >= tmp1
				vec0 = v2, vec1 = v0, vec2 = v1;
			}
		}
		// X座標を処理( vec[0].x = 1.0, vec[1].x = vec[2].x = 0.0 )
		vc0 = [ 1.0, vec0[1]/vec0[0], vec0[2]/vec0[0], vec0[3]/vec0[0] ];
		vc1 = [ vec1[0]-vc0[0]*vec1[0], vec1[1]-vc0[1]*vec1[0], vec1[2]-vc0[2]*vec1[0], vec1[3]-vc0[3]*vec1[0] ];
		vc2 = [ vec2[0]-vc0[0]*vec2[0], vec2[1]-vc0[1]*vec2[0], vec2[2]-vc0[2]*vec2[0], vec2[3]-vc0[3]*vec2[0] ];
		
		// Y=0.0 の例外処理
		if( vc1[1] == 0.0 ){
			if( vc1[2] == 0.0 ){
				nor4D[3] = 1.0;
			}else{
				nor4D[2] = 1.0;
			}
			break;
		}
		
		// Y座標を処理( vec[1].y = 1.0, vec[0].y = vec[2].y = 0.0 )
		vec1 = [ vc1[0]/vc1[1], 1.0, vc1[2]/vc1[1], vc1[2]/vc1[1] ];
		vec0 = [ vc0[0]-vec1[0]*vc0[1], vc0[1]-vec1[1]*vc0[1], vc0[2]-vec1[2]*vc0[1], vc0[3]-vec1[3]*vc0[1] ];
		vec2 = [ vc2[0]-vec1[0]*vc2[1], vc2[1]-vec1[1]*vc2[1], vc2[2]-vec1[2]*vc2[1], vc2[3]-vec1[3]*vc2[1] ];
		
		// Z=0.0 の例外処理
		if( vec2[2] == 0.0 ){
			nor4D[3] =1.0;
			break;
		}
		
		// Z座標を処理( vec[2].z = 1.0, vec[0].z = vec[1].z = 0.0 )
		vc2 = [ vec2[0]/vec2[2], vec2[1]/vec2[2], 1.0, vec2[3]/vec2[2] ];
		vc0 = [ vec0[0]-vc2[0]*vec0[2], vec0[1]-vc2[1]*vec0[2], vec0[2]-vc2[2]*vec0[2], vec0[3]-vc2[3]*vec0[2] ];
		vc1 = [ vec1[0]-vc2[0]*vec1[2], vec1[1]-vc2[1]*vec1[2], vec1[2]-vc2[2]*vec1[2], vec1[3]-vc2[3]*vec1[2] ];
		
		// 方向ベクトルを得る
		if( vc0[3] ){
			nor4D[0] = vc0[0]/vc0[3];
		}else{
			nor4D[0] = 0;
		}
		if( vc1[3] ){
			nor4D[1] = vc1[1]/vc1[3];
		}else{
			nor4D[1] = 0;
		}
		if( vc1[3] ){
			nor4D[2] = vc2[2]/vc2[3];
		}else{
			nor4D[2] = 0;
		}
		nor4D[3] = 1;
		
		break;
	}
	
	// 後処理：正負の方向を定める
	sign = fDWL.inProd4D( nor4D, [ vertice[0]-center[0], vertice[1]-center[1], vertice[2]-center[2], vertice[3]-center[3] ] );
	if( sign < 0 ){
		// 方向反転
		nor4D = [ nor4D[0]*(-1), nor4D[1]*(-1), nor4D[2]*(-1), nor4D[3]*(-1) ];
	}else
	if( sign == 0 ){
		// エラー
		nor4D = [ 0,0,0,0 ];
	}
	return nor4D;
};

//==================================================================
// CalcAve
// 配列の平均を計算
//------------------------------------------------------------------
//
//	elemNum:	要素数（配列の要素数）
//	itemNum:	アイテム数（平均をとるアイテムの数）
//	vertice:	頂点配列
//	vertIdx:	頂点インデックス
//
//==================================================================
fDWL.calcAve = function( elemNum, itemNum, vertice, vertIdx ){
	var idx = 0,
		ii = 0,
		jj = 0,
		aveArray = [];
	
	// 要素数分の配列要素を準備
	for( ii = 0; ii < elemNum; ++ii ){
		aveArray.push( 0 );
	}
	// 各アイテムを要素ごとに加算
	for( ii = 0; ii < itemNum; ++ii ){
		idx = vertIdx[ii]*elemNum;
		for( jj = 0; jj < elemNum; ++jj ){
			aveArray[jj] += vertice[idx+jj];
		}
	}
	// アイテム数で割って平均を出す
	for( ii = 0; ii < elemNum; ++ii ){
		aveArray[ii] /= itemNum;
	}
	
	return aveArray;
}

//==================================================================
// Tetrahedron4D
// 立方体のもととなる四面体(インデックス表記)
//------------------------------------------------------------------
//	vertex:											// 頂点、( x, y, z, h ) x 16個
//	Pyramid4:										// 立方体8個、インデックス形式
//==================================================================
fDWL.R4D.Pyramid4I = function( hPos ){
	index: {}										// 頂点1x4、インデックス形式
};

//==================================================================
// Cube4D
// 八胞体のもととなる立方体(インデックス表記)
//------------------------------------------------------------------
//	Pyramid4:										// 四面体5個、インデックス形式
//==================================================================
fDWL.R4D.Cube4I = function( hPos ){
	iPyramid4: {}									// 四面体5つ、インデックス形式
};


//==================================================================
// Pylams4D
// ５胞体の集合を生成
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 16個
//	Cube4:											// 立方体8個、インデックス形式
//
//==================================================================
fDWL.R4D.Pylams4D = function( gl, prg, pos, rotate, scale, vertex, color, index, chrnIdx, centIdx, offs, rot ){
	var norms = [],
		vert = [],
		center = [],
		vertIdx = [],
		vId = 0,
		idx = 0;
	this.gl = gl;
	this.prg = prg;
	this.pos = pos;					// [ x, y, z, h ]
	this.rotate = rotate;			// [ xy, yz, yh, zh, xh, xz ]
	this.scale = [ 1,1,1,1 ];		// [ x, y, z, h ]：対ワールドスケールはここでは設定しない
	this.mx4Rot = new fDWL.R4D.Matrix4();
	
	// ローカル変換
	this.vertex = fDWL.R4D.affine4D( vertex, rot, offs, scale );
	
	this.vertexNormal = [];			// 頂点の法線
	// 重心配列の生成
	this.centers = [];
	for( idx = 0; idx < chrnIdx.length; idx += 5 ){
		vertIdx = [ chrnIdx[idx], chrnIdx[idx+1], chrnIdx[idx+2], chrnIdx[idx+3], chrnIdx[idx+4] ];
		center = fDWL.calcAve( 4, 1, vertex, vertIdx );
		this.centers.push( center[0], center[1], center[2], center[3] );
	}
	// 体の法線の算出
	this.fieldNormal = [];
	for( idx = 0; idx < index.length; idx += 4 ){
		vId = idx*4;
		vert = [
			vertex[index[vId  ]], vertex[index[vId  ]+1], vertex[index[vId  ]+2], vertex[index[vId  ]+3],
			vertex[index[vId+1]], vertex[index[vId+1]+1], vertex[index[vId+1]+2], vertex[index[vId+1]+3],
			vertex[index[vId+2]], vertex[index[vId+2]+1], vertex[index[vId+2]+2], vertex[index[vId+2]+3],
			vertex[index[vId+3]], vertex[index[vId+3]+1], vertex[index[vId+3]+2], vertex[index[vId+3]+3]
		];
		
		// もう少しチェックが必要
//		center = [ 1,0,0,0 ];
		vertIdx = centIdx[Math.floor(idx/4)]*4;
		center = [ this.centers[vertIdx], this.centers[vertIdx+1], this.centers[vertIdx+2], this.centers[vertIdx+3] ];
		
		norms = fDWL.R4D.calcNormal4D( vert, center );
		this.fieldNormal.push( norms[0], norms[1], norms[2], norms[3] );
	}
	this.transform();
	this.workVtx = [];
	this.workNrm = [];
	this.color = color;
	this.index = index;
	this.centIdx = centIdx;
	this.triVertices = [];							// 生成三角形用バッファ
	this.triBuf = {};
};


fDWL.R4D.Pylams4D.prototype = {
	// 三角バッファの指定
	setTriBuffer: function( triBuf ){
		this.triBuf = triBuf;
	},
	// 三角錐切断・三角形生成
	dividePylams: function( hPos ){
		var cnt = 0,
			cutType = 0,
			iPylamid = [ 0, 0, 0, 0 ],
			fldCnt = 0,
			clrVec = [ 128, 128, 128, 128 ],
			pylamArray = this.index;

		for( cnt = 0; cnt < pylamArray.length; cnt += 4 ){	// 三角錐ごとにチェック
			fldCnt = Math.floor( cnt/20 );
			clrVec = [ this.color[ fldCnt*4 ], this.color[ fldCnt*4+1 ], this.color[ fldCnt*4+2 ], this.color[ fldCnt*4+3 ] ];
			
			iPylamid = [ pylamArray[cnt], pylamArray[cnt+1], pylamArray[cnt+2], pylamArray[cnt+3] ];
			cutType = this.getCutType( this.workVtx, iPylamid, hPos );
			
			// 各三角ごとに色を変化させる：デバグ用
			switch( cnt%20 ){
			case 0:
				clrVec[0] -= 32;
				break;
			case 4:
				clrVec[1] -= 32;
				break;
			case 8:
				clrVec[2] -= 32;
				break;
			case 12:
				clrVec[0] -= 32;
				clrVec[1] -= 32;
				break;
			case 16:
				clrVec[0] -= 32;
				clrVec[2] -= 32;
				break;
			default:
				clrVec[1] -= 32;
				clrVec[2] -= 32;
				break;
			}
			
			switch( cutType[0] ){
			default:
			case 0:	// ０～２包含／交差なし
				// 処理もなし
				break;
			case 1:	// 包含なし／１点交差（最標準パターン）
				this.makeTriangle3Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 2:	// 包含なし／２点交差（四角形パターン）
				this.makeTriangleDuo4Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 3:	// １点包含／２点交差パターン
				this.makeTriangle2Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 4:	// ２点包含／１点交差
				this.makeTriangle1Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 5:	// ３点包含／交差なし
				this.makeTriangle0Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 6:	// ４点包含／交差なし
				this.makeTriangleQuadra0Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );	// makeTriangle0Vtx * 4
				break;
			}
		}
	},
	// 四面体が分断されている状態を調査
	// 頂点H軸位置が正負で分類
	// 戻り値の位置には分類ごとに規則があるので注意
	// この規則を三角形構成時に利用する
	getCutType: function( vtx, iPylam, hPos ){
		var cutType = 0,
			cnt = 0,
			hVal = 0.0,
			minusBuf = [0,0,0,0],
			plusBuf = [0,0,0,0],
			zeroBuf = [0,0,0,0],
			mIdx = 0,
			pIdx = 0,
			zIdx = 0,
			minusNum = 0,
			plusNum = 0,
			zeroNum = 0,
			iVtx0 = 0,
			iVtx1 = 0,
			iVtx2 = 0,
			iVtx3 = 0;
		// ゼロ／正／負を調べてそれぞれのバッファに代入
		for( cnt = 0; cnt < 4; ++cnt ){
			hVal = vtx[ iPylam[cnt] ][3];
			if( hVal < hPos ){
				minusNum++;
				minusBuf[mIdx] = iPylam[cnt];
				mIdx++;
			}else
			if( hVal > hPos ){
				plusNum++;
				plusBuf[pIdx] = iPylam[cnt];
				pIdx++;
			}else{
				zeroNum++;
				zeroBuf[zIdx] = iPylam[cnt];
				zIdx++;
			}
		}
		// ゼロの個数で分類
		if( zeroNum === 0 ){
			if(( minusNum === 0 )||( plusNum === 0 )){
				// 正負何れかが０個ならば、描画せず
				cutType = 0;
			}else
			if( minusNum === 1 ){
				// 負が１(=正が３)
				iVtx0 = minusBuf[0];
				iVtx1 = plusBuf[0];
				iVtx2 = plusBuf[1];
				iVtx3 = plusBuf[2];
				cutType = 1;
			}else
			if( plusNum === 1 ){
				// 正が１(=負が３)
				iVtx0 = plusBuf[0];
				iVtx1 = minusBuf[0];
				iVtx2 = minusBuf[1];
				iVtx3 = minusBuf[2];
				cutType = 1;
			}else
			if( minusNum === 2 ){
				// 正負ともに２
				iVtx0 = minusBuf[0];
				iVtx1 = minusBuf[1];
				iVtx2 = plusBuf[0];
				iVtx3 = plusBuf[1];
				cutType = 2;
			}
		}else
		if( zeroNum === 1 ){
			// ゼロの個数が１
			if(( minusNum === 0 )||( plusNum === 0 )){
				cutType = 0;
			}else
			if( minusNum === 1 ){
				iVtx0 = zeroBuf[0];
				iVtx1 = minusBuf[0];
				iVtx2 = plusBuf[0];
				iVtx3 = plusBuf[1];
				cutType = 3;
			}else
			if( plusNum === 1 ){
				iVtx0 = zeroBuf[0];
				iVtx1 = plusBuf[0];
				iVtx2 = minusBuf[0];
				iVtx3 = minusBuf[1];
				cutType = 3;
			}
		}else
		if( zeroNum === 2 ){
			// ゼロの個数が２
			if(( minusNum === 0 )||( plusNum === 0 )){
				cutType = 0;
			}else{
				iVtx0 = zeroBuf[0];
				iVtx1 = zeroBuf[1];
				iVtx2 = minusBuf[0];
				iVtx3 = plusBuf[0];
				cutType = 4;
			}
		}else
		if( zeroNum === 3 ){
			// ゼロの個数が３＝一面が完全に含まれる
			iVtx0 = zeroBuf[0];
			iVtx1 = zeroBuf[1];
			iVtx2 = zeroBuf[2];
			if( minusNum === 0 ){
				iVtx3 = plusBuf[0];
			}else{
				iVtx3 = minusBuf[0];
			}
			cutType = 5;
		}else{
			// ゼロの個数が４＝四面体が全部含まれる
			iVtx0 = zeroBuf[0];
			iVtx1 = zeroBuf[1];
			iVtx2 = zeroBuf[2];
			iVtx3 = zeroBuf[3];
			cutType = 6;
		}
		
		return [ cutType, iVtx0, iVtx1, iVtx2, iVtx3 ];
	},
	// ３頂点を算出
	makeTriangle3Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate01 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p1][3] ),
			rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
			rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] );
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				rate01
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			nrm4,
			clrVec
		);
	},
	// ４頂点を算出、２三角形を登録
	makeTriangleDuo4Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
			rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] ),
			rate12 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
			rate13 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		// 四辺形を対角線で分けて２つの三角形を作っているが、
		// 一組の２三角形として(strip)描画したほうが望ましい
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			nrm4,
			clrVec
		);
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate13
			),
			nrm4,
			clrVec
		);
	},
	// 頂点の内１つが３Ｄ空間に包含：２点を算出
	makeTriangle2Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate0 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
			rate1 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate0
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate1
			),
			nrm4,
			clrVec
		);
	},
	// 頂点の内２つが３Ｄ空間に包含：１点を算出
	makeTriangle1Vtx( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate = fDWL.getLerpRate( hPos, vtx[p2][3], vtx[p3][3] );
		
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			fDWL.lerp3(
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate
			),
			nrm4,
			clrVec
		);
	},
	// 頂点の内３つが３Ｄ空間に包含されている
	makeTriangle0Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3];

		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			nrm4,
			clrVec
		);
	},
	// 頂点の内４つが３Ｄ空間に包含：４つの三角形を登録
	makeTriangleQuadra0Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4];

		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			nrm4,
			clrVec
		);
		this.setTriangle(
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			nrm4,
			clrVec
		);
		this.setTriangle(
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			nrm4,
			clrVec
		);
		this.setTriangle(
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			nrm4,
			clrVec
		);
	},
	// 三角形を描画バッファに登録
	setTriangle: function( v0, v1, v2, nrm4, clrVec ){
		// 面の法線を求める
		var vec0 = [ v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2] ],
			vec1 = [ v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2] ],
			nrm = fDWL.outProd( vec0, vec1 ),
			det = 0,
			vtx0 = [],
			vtx1 = [],
			vtx2 = [],
			tmp = 0;
		
		// ４次法線との方向を確認、逆なら反転させる
		nrm = fDWL.normalize3( nrm );
		det = nrm[0]*nrm4[0] + nrm[1]*nrm4[1] + nrm[2]*nrm4[2];
		if( det < 0 ){
			nrm[0] = -nrm[0];
			nrm[1] = -nrm[1];
			nrm[2] = -nrm[2];
			tmp = v0[0];
			v0[0] = v1[0];
			v1[0] = tmp;
			tmp = v0[1];
			v0[1] = v1[1];
			v1[1] = tmp;
			tmp = v0[2];
			v0[2] = v1[2];
			v1[2] = tmp;
		}
		
		vtx0 = [ v0[0], v0[1], v0[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		vtx1 = [ v1[0], v1[1], v1[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		vtx2 = [ v2[0], v2[1], v2[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		
		// 描画用三角バッファに詰め込む
		this.triBuf.setTriangle( vtx0, vtx1, vtx2 );
	},
	// ４Ｄ変換
	transform: function(){
		var mx4Scale = new fDWL.R4D.Matrix4(),
			mx4Rots = [
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4()
			],
			workVtx = new Array(),
			workNrm = new Array(),
			vec4 = [ 0.0, 0.0, 0.0, 0.0 ];
		
		// 各Matrixの生成
		mx4Scale.makeScale( this.scale );
		for( idx = 0; idx < 6; ++idx ){
			mx4Rots[idx].makeRot( idx, this.rotate[idx]);
		}
		// 各Matrixの合成
		this.mx4Rot = mx4Scale.
				mul( mx4Rots[0] ).
				mul( mx4Rots[1] ).
				mul( mx4Rots[2] ).
				mul( mx4Rots[3] ).
				mul( mx4Rots[4] ).
				mul( mx4Rots[5] );
		// 各頂点のaffine変換
		for( idx = 0; idx < this.vertex.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.vertex[idx], this.vertex[idx+1], this.vertex[idx+2], this.vertex[idx+3] );
			vec4[0] += this.pos[0];
			vec4[1] += this.pos[1];
			vec4[2] += this.pos[2];
			vec4[3] += this.pos[3];
			workVtx.push( vec4 );
		}
		this.workVtx = workVtx;
		// 各法線のaffine変換
		for( idx = 0; idx < this.fieldNormal.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.fieldNormal[idx], this.fieldNormal[idx+1], this.fieldNormal[idx+2], this.fieldNormal[idx+3] );
			workNrm.push( vec4 );
		}
		this.workNrm = workNrm;
	},
	// 平行移動量の設定
	setPos: function( pos ){
		this.pos = pos;
	},
	// 回転の設定
	setRotate: function( rotate ){
		// rotate = [ xy, yz, yh, zh, xh, xz ]
		this.rotate = rotate;
	},
	// スケーリングの設定
	setScale: function( scale ){
		this.scale = scale;
	},
	// 頂点の法線を生成：初期化時のみ使用可能
	makeVertexNormal: function(){
		var idx = 0;
		for( idx = 0; idx < 16; ++idx ){
			this.vertexNormal[idx] = this.vertex[idx]/2;
		}
	},
};

//==================================================================
// Octachoron
// 八胞体を生成
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 16個
//	Cube4:											// 立方体8個、インデックス形式
//
//==================================================================
fDWL.R4D.Octachoron = function( gl, prg, pos, rotate, scale, color ){
	this.gl = gl;
	this.prg = prg;
	this.pos = pos;					// [ x, y, z, h ]
	this.rotate = rotate;			// [ xy, yz, yh, zh, xh, xz ]
	this.scale = scale;				// [ x, y, z, h ]
	this.mx4Rot = new fDWL.R4D.Matrix4();
	this.vertex = [
		-1.0, 1.0,  1.0,  1.0,   1.0, 1.0,  1.0,  1.0,   -1.0, -1.0,  1.0,  1.0,    1.0, -1.0,  1.0,  1.0,
		 1.0, 1.0, -1.0,  1.0,  -1.0, 1.0, -1.0,  1.0,    1.0, -1.0, -1.0,  1.0,   -1.0, -1.0, -1.0,  1.0,
		-1.0, 1.0,  1.0, -1.0,   1.0, 1.0,  1.0, -1.0,   -1.0, -1.0,  1.0, -1.0,    1.0, -1.0,  1.0, -1.0,
		 1.0, 1.0, -1.0, -1.0,  -1.0, 1.0, -1.0, -1.0,    1.0, -1.0, -1.0, -1.0,   -1.0, -1.0, -1.0, -1.0
	];
	this.vertexNormal = [];			// 頂点の法線
	this.fieldNormal = [			// 体の法線、iCUbe4と同期
		 0.0, 0.0, 0.0, 1.0,		// こっち(h=+1)
		 0.0, 0.0, 0.0,-1.0,		// あっち(h=-1)
		 1.0, 0.0, 0.0, 0.0,		// 右(X=+1)
		-1.0, 0.0, 0.0, 0.0,		// 左(X=-1)
		 0.0, 1.0, 0.0, 0.0,		// 上(Y=+1)
		 0.0,-1.0, 0.0, 0.0,		// 下(Y=-1)
		 0.0, 0.0, 1.0, 0.0,		// 手前(Z=+1)
		 0.0, 0.0,-1.0, 0.0			// 奥(Z=-1)
	];
	this.workVtx = [];
	this.workNrm = [];
	this.transform();
	this.color = color;
	this.iCube4 = [
		 0,  1,  2,  5,   1,  2,  3,  6,    4,  5,  6,  1,    5,  6,  7,  2,    1,  2,  5,  6,	// こっち(h=+1)
		 8,  9, 10, 13,   9, 10, 11, 14,   12, 13, 14,  9,   13, 14, 15, 10,    9, 10, 13, 14,	// あっち(h=-1)
		 9,  1, 11, 12,   1, 11,  3,  6,    4, 12,  6,  1,   11,  6, 12, 14,    1, 11,  6, 12,	// 右(X=+1)
		 0,  8,  2,  5,   8,  2, 10, 15,    5, 13, 15,  8,    5,  7, 15,  2,    2,  8,  5, 15,	// 左(X=-1)
		 0,  1,  8,  5,   1,  8,  9, 12,    5,  4, 12,  1,    5, 12, 13,  8,    1,  8,  5, 12,	// 上(Y=+1)
		 2, 10, 11, 15,   2,  3, 11,  6,   15, 14,  6, 11,   15,  6,  7,  2,    2, 11,  6, 15,	// 下(Y=-1)
		 0,  1,  2,  8,   1,  2,  3, 11,    8,  9, 11,  1,    8, 11, 10,  2,    1,  2,  8, 11, 	// 手前(Z=+1)
		13, 12, 15,  5,  12, 15, 14,  6,    5,  4,  6, 12,    5,  6,  7, 15,   12, 15,  5,  6	// 奥(Z=-1)
	];
	this.triVertices = [];							// 生成三角形用バッファ
	this.triBuf = {};
};


fDWL.R4D.Octachoron.prototype = {
	// 三角バッファの指定
	setTriBuffer: function( triBuf ){
		this.triBuf = triBuf;
	},
	// 三角錐切断・三角形生成
	dividePylams: function( hPos ){
		var pylamCnt = this.iCube4.length,
			cnt = 0,
			cutType = 0,
			iPylamid = [ 0, 0, 0, 0 ],
			fldCnt = 0,
			clrVec = [ 128, 128, 128, 128 ],
			pylamArray = this.iCube4;

		for( cnt = 0; cnt < pylamCnt; cnt += 4 ){	// 三角錐ごとにチェック
			fldCnt = Math.floor( cnt/20 );
			clrVec = [ this.color[ fldCnt*4 ], this.color[ fldCnt*4+1 ], this.color[ fldCnt*4+2 ], this.color[ fldCnt*4+3 ] ];
			
			iPylamid = [ pylamArray[cnt], pylamArray[cnt+1], pylamArray[cnt+2], pylamArray[cnt+3] ];
			cutType = this.getCutType( this.workVtx, iPylamid, hPos );
			
			// 各三角ごとに色を変化させる：デバグ用
			switch( cnt%20 ){
			case 0:
				clrVec[0] -= 32;
				break;
			case 4:
				clrVec[1] -= 32;
				break;
			case 8:
				clrVec[2] -= 32;
				break;
			case 12:
				clrVec[0] -= 32;
				clrVec[1] -= 32;
				break;
			case 16:
				clrVec[0] -= 32;
				clrVec[2] -= 32;
				break;
			default:
				clrVec[1] -= 32;
				clrVec[2] -= 32;
				break;
			}
			
			switch( cutType[0] ){
			default:
			case 0:	// ０～２包含／交差なし
				// 処理もなし
				break;
			case 1:	// 包含なし／１点交差（最標準パターン）
				this.makeTriangle3Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 2:	// 包含なし／２点交差（四角形パターン）
				this.makeTriangleDuo4Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 3:	// １点包含／２点交差パターン
				this.makeTriangle2Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 4:	// ２点包含／１点交差
				this.makeTriangle1Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 5:	// ３点包含／交差なし
				this.makeTriangle0Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );
				break;
			case 6:	// ４点包含／交差なし
				this.makeTriangleQuadra0Vtx( hPos, this.workVtx, cutType, this.workNrm[fldCnt], clrVec );	// makeTriangle0Vtx * 4
				break;
			}
		}
	},
	// 四面体が分断されている状態を調査
	// 頂点H軸位置が正負で分類
	// 戻り値の位置には分類ごとに規則があるので注意
	// この規則を三角形構成時に利用する
	getCutType: function( vtx, iPylam, hPos ){
		var cutType = 0,
			cnt = 0,
			hVal = 0.0,
			minusBuf = [0,0,0,0],
			plusBuf = [0,0,0,0],
			zeroBuf = [0,0,0,0],
			mIdx = 0,
			pIdx = 0,
			zIdx = 0,
			minusNum = 0,
			plusNum = 0,
			zeroNum = 0,
			iVtx0 = 0,
			iVtx1 = 0,
			iVtx2 = 0,
			iVtx3 = 0;
		// ゼロ／正／負を調べてそれぞれのバッファに代入
		for( cnt = 0; cnt < 4; ++cnt ){
			hVal = vtx[ iPylam[cnt] ][3];
			if( hVal < hPos ){
				minusNum++;
				minusBuf[mIdx] = iPylam[cnt];
				mIdx++;
			}else
			if( hVal > hPos ){
				plusNum++;
				plusBuf[pIdx] = iPylam[cnt];
				pIdx++;
			}else{
				zeroNum++;
				zeroBuf[zIdx] = iPylam[cnt];
				zIdx++;
			}
		}
		// ゼロの個数で分類
		if( zeroNum === 0 ){
			if(( minusNum === 0 )||( plusNum === 0 )){
				// 正負何れかが０個ならば、描画せず
				cutType = 0;
			}else
			if( minusNum === 1 ){
				// 負が１(=正が３)
				iVtx0 = minusBuf[0];
				iVtx1 = plusBuf[0];
				iVtx2 = plusBuf[1];
				iVtx3 = plusBuf[2];
				cutType = 1;
			}else
			if( plusNum === 1 ){
				// 正が１(=負が３)
				iVtx0 = plusBuf[0];
				iVtx1 = minusBuf[0];
				iVtx2 = minusBuf[1];
				iVtx3 = minusBuf[2];
				cutType = 1;
			}else
			if( minusNum === 2 ){
				// 正負ともに２
				iVtx0 = minusBuf[0];
				iVtx1 = minusBuf[1];
				iVtx2 = plusBuf[0];
				iVtx3 = plusBuf[1];
				cutType = 2;
			}
		}else
		if( zeroNum === 1 ){
			// ゼロの個数が１
			if(( minusNum === 0 )||( plusNum === 0 )){
				cutType = 0;
			}else
			if( minusNum === 1 ){
				iVtx0 = zeroBuf[0];
				iVtx1 = minusBuf[0];
				iVtx2 = plusBuf[0];
				iVtx3 = plusBuf[1];
				cutType = 3;
			}else
			if( plusNum === 1 ){
				iVtx0 = zeroBuf[0];
				iVtx1 = plusBuf[0];
				iVtx2 = minusBuf[0];
				iVtx3 = minusBuf[1];
				cutType = 3;
			}
		}else
		if( zeroNum === 2 ){
			// ゼロの個数が２
			if(( minusNum === 0 )||( plusNum === 0 )){
				cutType = 0;
			}else{
				iVtx0 = zeroBuf[0];
				iVtx1 = zeroBuf[1];
				iVtx2 = minusBuf[0];
				iVtx3 = plusBuf[0];
				cutType = 4;
			}
		}else
		if( zeroNum === 3 ){
			// ゼロの個数が３＝一面が完全に含まれる
			iVtx0 = zeroBuf[0];
			iVtx1 = zeroBuf[1];
			iVtx2 = zeroBuf[2];
			if( minusNum === 0 ){
				iVtx3 = plusBuf[0];
			}else{
				iVtx3 = minusBuf[0];
			}
			cutType = 5;
		}else{
			// ゼロの個数が４＝四面体が全部含まれる
			iVtx0 = zeroBuf[0];
			iVtx1 = zeroBuf[1];
			iVtx2 = zeroBuf[2];
			iVtx3 = zeroBuf[3];
			cutType = 6;
		}
		
		return [ cutType, iVtx0, iVtx1, iVtx2, iVtx3 ];
	},
	// ３頂点を算出
	makeTriangle3Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate01 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p1][3] ),
			rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
			rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] );
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				rate01
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			nrm4,
			clrVec
		);
	},
	// ４頂点を算出、２三角形を登録
	makeTriangleDuo4Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
			rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] ),
			rate12 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
			rate13 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		// 四辺形を対角線で分けて２つの三角形を作っているが、
		// 一組の２三角形として(strip)描画したほうが望ましい
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			nrm4,
			clrVec
		);
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate13
			),
			nrm4,
			clrVec
		);
	},
	// 頂点の内１つが３Ｄ空間に包含：２点を算出
	makeTriangle2Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate0 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
			rate1 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate0
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate1
			),
			nrm4,
			clrVec
		);
	},
	// 頂点の内２つが３Ｄ空間に包含：１点を算出
	makeTriangle1Vtx( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate = fDWL.getLerpRate( hPos, vtx[p2][3], vtx[p3][3] );
		
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			fDWL.lerp3(
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate
			),
			nrm4,
			clrVec
		);
	},
	// 頂点の内３つが３Ｄ空間に包含されている
	makeTriangle0Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3];

		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			nrm4,
			clrVec
		);
	},
	// 頂点の内４つが３Ｄ空間に包含：４つの三角形を登録
	makeTriangleQuadra0Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		var p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4];

		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			nrm4,
			clrVec
		);
		this.setTriangle(
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			nrm4,
			clrVec
		);
		this.setTriangle(
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			nrm4,
			clrVec
		);
		this.setTriangle(
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			nrm4,
			clrVec
		);
	},
	// 三角形を描画バッファに登録
	setTriangle: function( v0, v1, v2, nrm4, clrVec ){
		// 面の法線を求める
		var vec0 = [ v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2] ],
			vec1 = [ v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2] ],
			nrm = fDWL.outProd( vec0, vec1 ),
			det = 0,
			vtx0 = [],
			vtx1 = [],
			vtx2 = [],
			tmp = 0;
		
		// ４次法線との方向を確認、逆なら反転させる
		nrm = fDWL.normalize3( nrm );
		det = nrm[0]*nrm4[0] + nrm[1]*nrm4[1] + nrm[2]*nrm4[2];
		if( det < 0 ){
			nrm[0] = -nrm[0];
			nrm[1] = -nrm[1];
			nrm[2] = -nrm[2];
			tmp = v0[0];
			v0[0] = v1[0];
			v1[0] = tmp;
			tmp = v0[1];
			v0[1] = v1[1];
			v1[1] = tmp;
			tmp = v0[2];
			v0[2] = v1[2];
			v1[2] = tmp;
		}
		
		vtx0 = [ v0[0], v0[1], v0[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		vtx1 = [ v1[0], v1[1], v1[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		vtx2 = [ v2[0], v2[1], v2[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		
		// 描画用三角バッファに詰め込む
		this.triBuf.setTriangle( vtx0, vtx1, vtx2 );
	},
	// ４Ｄ変換
	transform: function(){
		var mx4Scale = new fDWL.R4D.Matrix4(),
			mx4Rots = [
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4()
			],
			workVtx = new Array(),
			workNrm = new Array(),
			vec4 = [ 0.0, 0.0, 0.0, 0.0 ];
		
		// 各Matrixの生成
		mx4Scale.makeScale( this.scale );
		for( idx = 0; idx < 6; ++idx ){
			mx4Rots[idx].makeRot( idx, this.rotate[idx]);
		}
		// 各Matrixの合成
		this.mx4Rot = mx4Scale.
				mul( mx4Rots[0] ).
				mul( mx4Rots[1] ).
				mul( mx4Rots[2] ).
				mul( mx4Rots[3] ).
				mul( mx4Rots[4] ).
				mul( mx4Rots[5] );
		// 各頂点のaffine変換
		for( idx = 0; idx < this.vertex.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.vertex[idx], this.vertex[idx+1], this.vertex[idx+2], this.vertex[idx+3] );
			vec4[0] += this.pos[0];
			vec4[1] += this.pos[1];
			vec4[2] += this.pos[2];
			vec4[3] += this.pos[3];
			workVtx.push( vec4 );
		}
		this.workVtx = workVtx;
		// 各法線のaffine変換
		for( idx = 0; idx < this.fieldNormal.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.fieldNormal[idx], this.fieldNormal[idx+1], this.fieldNormal[idx+2], this.fieldNormal[idx+3] );
			workNrm.push( vec4 );
		}
		this.workNrm = workNrm;
	},
	// 平行移動量の設定
	setPos: function( pos ){
		this.pos = pos;
	},
	// 回転の設定
	setRotate: function( rotate ){
		// rotate = [ xy, yz, yh, zh, xh, xz ]
		this.rotate = rotate;
	},
	// スケーリングの設定
	setScale: function( scale ){
		this.scale = scale;
	},
	// 頂点の法線を生成：初期化時のみ使用可能
	makeVertexNormal: function(){
		var idx = 0;
		for( idx = 0; idx < 16; ++idx ){
			this.vertexNormal[idx] = this.vertex[idx]/2;
		}
	}
};


//==================================================================
// I-Field
// Imaginary Field、R-Fieldを生成する元データ
//------------------------------------------------------------------
/*
	iField: {										// iField(imaginaryField)の配列
		hPosition: {},								// iフィールドの各h値
		vertex: {},									// 各hにおけるフィールドの頂点座標
		normal: {},									// 各hにおけるフィールドの法線
		color: {},									// 各hにおけるフィールドの頂点色
	}

	setVertex( vertex ):							// 頂点配列を設定
	setNormal( normal ):							// 法線配列を設定
	setColor( color ):								// 色配列を設定
*/
//==================================================================
fDWL.D4D.IField = function( hPos ){
	this.vertex = [];
	this.normal = [];
	this.color  = [];
	this.hPosition = hPos;
};

fDWL.D4D.IField.prototype = {
	// 頂点配列を設定
	setVertex: function( vertex ){
		this.vertex = vertex;
	},
	// 法線をセット
	setNormal: function( normal ){
		this.normal = normal;
	},
	// 頂点から法線を作成：事前に頂点設定のこと
	makeNormal: function( numX, numZ, base, isRvs ){
		var flg = [ true, true, true, true ],	// 第２,３,４,１象限
			cnt = 0,
			cntX = 0,
			cntZ = 0,
			vtxId = 0,		// 頂点の座標番号
			subIdZ = 0,
			vec0 = [ 0.0, 0.0, 0.0 ],
			vec1 = [ 0.0, 0.0, 0.0 ],
			vecD = [ 0.0, 0.0, 0.0 ],
			vecBuf = [ 0.0, 0.0, 0.0 ],
			baseX = 0.0,
			baseY = 0.0,
			baseZ = 0.0,
			vecNum = 0;

		for( cntZ = 0; cntZ < numZ; ++cntZ ){
			subIdZ = cntZ*numX*3;

			for( cntX = 0; cntX < numX; ++cntX ){
				// 考慮しない平面をチェック
				flg = [ true, true, true, true ];
				if( 0 === cntZ ){
					flg[0] = flg[1] = false;
				}else
				if( cntZ === (numZ-1) ){
					flg[2] = flg[3] = false;
				}
				if( 0 === cntX ){
					flg[0] = flg[2] = false;
				}else
				if( cntX === (numX-1) ){
					flg[1] = flg[3] = false;
				}

				vtxId = cntX*3 + subIdZ;

				baseX = this.vertex[vtxId  ]+base[vtxId  ];
				baseY = this.vertex[vtxId+1]+base[vtxId+1];
				baseZ = this.vertex[vtxId+2]+base[vtxId+2];
				vecBuf = [ 0.0, 0.0, 0.0 ];
				vecNum = 0;

				for( cnt = 0; cnt < 4; ++cnt ){
					if( false === flg[cnt] ){
						continue;
					}
					if( cnt === 0 ){	// X:0,Z:0側
						vec0[0] = this.vertex[vtxId-3]+base[vtxId-3];
						vec0[1] = this.vertex[vtxId-2]+base[vtxId-2];
						vec0[2] = this.vertex[vtxId-1]+base[vtxId-1];
						vec1[0] = this.vertex[vtxId-numX*3  ]+base[vtxId-numX*3  ];
						vec1[1] = this.vertex[vtxId-numX*3+1]+base[vtxId-numX*3+1];
						vec1[2] = this.vertex[vtxId-numX*3+2]+base[vtxId-numX*3+2];
					}else
					if( cnt === 1 ){	// X:max,Z:0側
						vec0[0] = this.vertex[vtxId-numX*3  ]+base[vtxId-numX*3  ];
						vec0[1] = this.vertex[vtxId-numX*3+1]+base[vtxId-numX*3+1];
						vec0[2] = this.vertex[vtxId-numX*3+2]+base[vtxId-numX*3+2];
						vec1[0] = this.vertex[vtxId+3]+base[vtxId+3];
						vec1[1] = this.vertex[vtxId+4]+base[vtxId+4];
						vec1[2] = this.vertex[vtxId+5]+base[vtxId+5];
					}else
					if( cnt === 2 ){	// X:0,Z:max側
						vec0[0] = this.vertex[vtxId+numX*3  ]+base[vtxId+numX*3  ];
						vec0[1] = this.vertex[vtxId+numX*3+1]+base[vtxId+numX*3+1];
						vec0[2] = this.vertex[vtxId+numX*3+2]+base[vtxId+numX*3+2];
						vec1[0] = this.vertex[vtxId-3]+base[vtxId-3];
						vec1[1] = this.vertex[vtxId-2]+base[vtxId-2];
						vec1[2] = this.vertex[vtxId-1]+base[vtxId-1];
					}else
					if( cnt === 3 ){	// X:max,Z:max側
						vec0[0] = this.vertex[vtxId+3]+base[vtxId+3];
						vec0[1] = this.vertex[vtxId+4]+base[vtxId+4];
						vec0[2] = this.vertex[vtxId+5]+base[vtxId+5];
						vec1[0] = this.vertex[vtxId+numX*3  ]+base[vtxId+numX*3  ];
						vec1[1] = this.vertex[vtxId+numX*3+1]+base[vtxId+numX*3+1];
						vec1[2] = this.vertex[vtxId+numX*3+2]+base[vtxId+numX*3+2];
					}
					vec0[0] -= baseX;
					vec0[1] -= baseY;
					vec0[2] -= baseZ;
					vec1[0] -= baseX;
					vec1[1] -= baseY;
					vec1[2] -= baseZ;
					if( true === isRvs ){
						vecD = fDWL.outProd( vec0, vec1 );
					}else{
						vecD = fDWL.outProd( vec1, vec0 );
					}
					vecD = fDWL.normalize3( vecD );
					vecBuf[0] += vecD[0];
					vecBuf[1] += vecD[1];
					vecBuf[2] += vecD[2];
					vecNum++;
				}
				this.normal.push( vecBuf[0]/vecNum, vecBuf[1]/vecNum, vecBuf[2]/vecNum );
			}
		}
	},

	// 色をセット
	setColor: function( color ){
		this.color = color;
	},
	// 同色で色をすべてセット
	setAllColor: function( color, num ){
		var idx = 0;
		for( idx = 0; idx < num; ++idx ){
			this.color.push( color[0], color[1], color[2], color[3] );
		}
	},
	// テクスチャの設定
	setTex: function( tex ){
		this.tex = tex;
	},
/*
	setTex: function( gl, source ){
		this.tex = fDWL.WGL.createTexture( gl, source );
	},
*/
	// テクスチャの取得
	getTex: function( gl, source ){
		return this.tex;
	},
	clone: function(){
		var newIField = new fDWL.D4D.IField( this.hPosition ),
			idx = 0;
		
		for( idx = 0; idx < this.vertex.length; ++idx ){
			newIField.vertex.push( this.vertex[idx] );
		}
		for( idx = 0; idx < this.normal.length; ++idx ){
			newIField.normal.push( this.normal[idx] );
		}
		for( idx = 0; idx < this.color.length; ++idx ){
			newIField.color.push( this.color[idx] );
		}
		
		return newIField;
	}
};


//==================================================================
// Field
// Filed4D、４Ｄ平面
//------------------------------------------------------------------
/*
	gl:												// webGL オブジェクト
	prg:											// シェーダプログラム
	pos: { x: 0, y: 0, z: 0 },						// フィールド全体の基準位置[ -∞, +∞ ]
	rotate: { x: 0, y: 0, z: 0 },					// フィールド全体の回転角[ 0～360 ]
	index: {},										// rFieldの頂点配列順序を示すインデックス
	vertNum: { x: 0, y:0 },							// フィールドの縦横の単位数[ 1～∞ ]
	space: { x: 1, y: 1 },							// 各セルの縦横幅
	baseVtx: {},									// 基準頂点座標	: spaceとVertNumから生成
	vertex: {},										// 表示用頂点
	normal: {},										// 頂点の法線
	color: {},										// 頂点の色

	iField[]: {										// iField(imaginaryField)の配列
		hPosition: {},								// iフィールドの各h値
		vertex: {},									// 各hにおけるフィールドの頂点座標
		normal: {},									// 各hにおけるフィールドの法線
		color: {},									// 各hにおけるフィールドの頂点色
	},

	vboList: {},									// 表示用頂点バッファ(毎回更新)
	ibo: {}											// 表示用インデックスバッファ
*/
//==================================================================
fDWL.D4D.Field = function( gl, pos, rot, vertNum, difX, difZ ){
	var maxX, maxZ, cntX, cntZ, tileNo, offsX, offsZ;

	this.gl = gl;
	this.pos = pos;
	this.rotate = rot;
	this.vertNum = vertNum;
	this.difX = difX;
	this.difZ = difZ;
	this.index = [];
	this.baseVtx = [];
	this.vertex = [];
	this.normal = [];
	this.color = [];
	this.iField = [];
	this.vboList = [];
	this.texCoord = [];
	this.oldH = (-100);
	this.low = 0;
	this.high = 0;
	this.modelMatrix = mat4.identity(mat4.create());
	this.mvpMatrix = mat4.identity(mat4.create());
	this.invMatrix = mat4.identity(mat4.create());

	maxX = vertNum[0], maxZ = vertNum[1];
	tileNo = 0;
	offsZ = 0;
	for( cntZ = 0; cntZ < maxZ; ++cntZ ){
		offsX = 0;
		for( cntX = 0; cntX < maxX; ++cntX ){
			// 基準枠生成
			this.baseVtx.push( offsX, 0, offsZ );
			offsX += difX;

			// 頂点インデックス作成
			tileNo = cntX + cntZ*maxX;
			if(( cntX != maxX-1 )&&( cntZ != maxZ-1 )){
				this.index.push( tileNo, tileNo+maxX, tileNo+1, tileNo+1, tileNo+maxX, tileNo+maxX+1 );
			}
			// テクスチャ座標生成
			this.texCoord.push( (cntX/(maxX-1)), (cntZ/(maxZ-1)) );
		}
		offsZ += difZ;
	}

	this.Ibo = fDWL.WGL.createIbo( this.gl, this.index );
};


//------------------------------------------------------------------
// Field4D Prototype
//------------------------------------------------------------------
fDWL.D4D.Field.prototype = {
	// I-Fieldを設定
	setIField: function( iField ){
		this.iField.push( iField );
	},
	// I-Fieldを設定
	getIField: function(){
		return this.iField;
	},
	// VBOListの取得
	getVBOList: function(){
		return this.vboList;
	},
	// IBOの取得
	getIBO: function(){
		return this.Ibo;
	},
	// IBOの更新
	resetIbo: function(){
		this.Ibo = fDWL.WGL.createIbo( this.gl, this.index );
	},
	// index長さの取得
	getLength: function(){
		return this.index.length;
	},
	// 基準座標取得
	getPos: function(){
		return this.pos;
	},
	getRotate: function(){
		return this.rotate;
	},
	// 基準枠取得
	getBaseVtx: function(){
		return this.baseVtx;
	},
	// 描画判定
	isDraw: function( viewPos ){
		
		// 仮
		
		return true;
	},
	// updateを行うかチェック
	isSkipUpdate: function( hPos ){
		var oldH = this.oldH;
		this.oldH = hPos;
		return ( oldH == hPos );
	},
	// 一度実行済みかチェック
	anotherIsSkip: function( hPos ){
		var oldH = this.oldH;
		this.oldH = hPos;
		return ( oldH >= 0 );
	},
	// 升目方向変更
	switchCellDir: function( cellNo ){
		var idx = cellNo*6,
			tmpIdx = [
				this.index[idx  ],
				this.index[idx+1],
				this.index[idx+2],
				this.index[idx+3],
				this.index[idx+4],
				this.index[idx+5]
			];
		this.index[idx  ] = tmpIdx[0];
		this.index[idx+1] = tmpIdx[1];
		this.index[idx+2] = tmpIdx[5];
		this.index[idx+3] = tmpIdx[0];
		this.index[idx+4] = tmpIdx[5];
		this.index[idx+5] = tmpIdx[3];
	},
	// 各IFieldに一括でテクスチャ設定
	setTextures: function( tex ){
		var idx = 0;
		for( idx in tex ){
			this.iField[idx].setTex( tex[idx] );
		}
	},
	// テクスチャ座標位置修正
	modifyTexture: function( offs, size ){
		var idx = 0,
			oldX = 0,
			difX = offs[0],
			difY = offs[1];
		
		for( idx = 0; idx < this.texCoord.length; idx += 2 ){
			oldX = this.texCoord[idx];
			this.texCoord[idx  ] = difX;
			this.texCoord[idx+1] = difY;
			
			if( this.texCoord[idx+2] < oldX ){
				difX = offs[0];
				difY += size[1];
			}else{
				difX += size[0];
			}
		}
		
	},
	// rateとテクスチャを取得
	getTexRate: function( hPos ){
		var	lowNo = this.getLow( hPos ),
			highNo = this.getHigh( hPos ),
			rate = 1.0 - fDWL.getLerpRate( hPos, lowNo, highNo ),
			tex0 = this.iField[lowNo].getTex(),
			tex1 = this.iField[highNo].getTex();
		return [ tex0, tex1, rate ];
	},
	// 内部オブジェクトのＨ方向範囲を記録
	calcHighLow: function(){
		var high = this.iField[0].hPosition,
			low = this.iField[0].hPosition;
		for( var idx in this.iField ){
			if( high < this.iField[idx].hPosition ){
				high = this.iField[idx].hPosition;
			}
			if( low > this.iField[idx].hPosition ){
				low = this.iField[idx].hPosition;
			}
		}
		this.high = high;
		this.low = low;
	},
	// 
	isRange: function( hPos ){
		return (( this.low <= hPos )&&( hPos < this.high ));
	},

	// Field4D をアップデート：内在データとh座標から表示用フィールドを作成する
	update: function( hPos ){
		var	rate = 1.0,
			baseIdx = 0;
			invRate = 0.0;
			lowNo = this.getLow( hPos ),
			highNo = this.getHigh( hPos ),
			maxVtxNum = (this.vertNum[0])*(this.vertNum[1]),
			pos_vbo = {},
			nor_vbo = {},
			col_vbo = {};

		if( this.isSkipUpdate( hPos ) ){
			return;
		}

		// 上下iFieldからの偏りの算出
		rate = fDWL.getLerpRate( hPos, lowNo, highNo );

		this.vertex.length = 0;
		this.normal.length = 0;
		this.color.length  = 0;

		// 頂点データの合成
		for( idx = 0; idx < maxVtxNum; idx++ ){
			baseIdx = idx*3;
			this.vertex.push(
				(this.baseVtx[baseIdx  ] + fDWL.lerp1( this.iField[lowNo].vertex[baseIdx  ], this.iField[highNo].vertex[baseIdx  ], rate )),
				(this.baseVtx[baseIdx+1] + fDWL.lerp1( this.iField[lowNo].vertex[baseIdx+1], this.iField[highNo].vertex[baseIdx+1], rate )),
				(this.baseVtx[baseIdx+2] + fDWL.lerp1( this.iField[lowNo].vertex[baseIdx+2], this.iField[highNo].vertex[baseIdx+2], rate ))
			);
			// 法線データは自動生成が望ましいが...
			// 法線データの合成
			this.normal.push(
				fDWL.lerp1( this.iField[lowNo].normal[baseIdx  ], this.iField[highNo].normal[baseIdx  ], rate ),
				fDWL.lerp1( this.iField[lowNo].normal[baseIdx+1], this.iField[highNo].normal[baseIdx+1], rate ),
				fDWL.lerp1( this.iField[lowNo].normal[baseIdx+2], this.iField[highNo].normal[baseIdx+2], rate )
			);
			// 頂点色データの合成
			baseIdx = idx*4;
			this.color.push(
				fDWL.lerp1( this.iField[lowNo].color[baseIdx  ], this.iField[highNo].color[baseIdx  ], rate ),
				fDWL.lerp1( this.iField[lowNo].color[baseIdx+1], this.iField[highNo].color[baseIdx+1], rate ),
				fDWL.lerp1( this.iField[lowNo].color[baseIdx+2], this.iField[highNo].color[baseIdx+2], rate ),
				fDWL.lerp1( this.iField[lowNo].color[baseIdx+3], this.iField[highNo].color[baseIdx+3], rate )
			);
		}

		// vbo３つの更新
		pos_vbo = fDWL.WGL.createVbo( this.gl, this.vertex );
		nor_vbo = fDWL.WGL.createVbo( this.gl, this.normal );
		col_vbo = fDWL.WGL.createVbo( this.gl, this.color );
		tex_vbo = fDWL.WGL.createVbo( this.gl, this.texCoord );

		// vboListの更新
		this.vboList = [pos_vbo, nor_vbo, col_vbo, tex_vbo];
	},
	
	// Field4D を表示
	draw: function( shader, hPos, vwPos, viewProjMtx, shaderParam ){
		if( this.isDraw( vwPos ) === false ){
			return;
		}
		var gl = this.gl,
			texRate = this.getTexRate( hPos );
		
		fDWL.WGL.makeMatrix(
				this.pos,
				this.rotate,
				[ 1.0, 1.0, 1.0 ],
				viewProjMtx,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.modelMatrix;
		shaderParam[1] = this.mvpMatrix;
		shaderParam[2] = this.invMatrix;
//		shaderParam[3] = this.texMatrix;	// 外部で与えられる
//		shaderParam[4] = this.lgtMatrix;	// 外部で与えられる
//		shaderParam[5] = light00.position;	// 外部で与えられる
//		shaderParam[6] = 0;					// textureS, 外部で与えられる
//		shaderParam[7] = 1;					// texture unit番号
//		shaderParam[8] = 2;					// texture unit番号
		shaderParam[9] = texRate[2];
		
		shader.setProgram( shaderParam );
		
		// 引数として受け取った配列を処理する
		for( var idx in this.vboList ){
			gl.bindBuffer( gl.ARRAY_BUFFER, this.vboList[idx]);
			gl.enableVertexAttribArray( shader.attrLoc[idx]);
			gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0);
		}
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.Ibo );
		gl.drawElements( gl.TRIANGLES, this.index.length, gl.UNSIGNED_SHORT, 0);
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
	},
	
	// private
	// 直前(or=)のiField番号を調査
	getLow: function( hPos ){
		var idx = 0,
			low = 0,
			maxIdx = this.iField.length;

		// hPos直前(or＝)のiFieldを探す
		for( idx = 0; idx < maxIdx; ++idx ){
			if( this.iField[ idx ].hPosition > hPos ){
				break;
			}
			low = idx;
		}
		return low;
	},
	// 直後(<)のiField番号を調査
	getHigh: function( hPos ){
		var idx = 0,
			high = this.iField.length-1,
			maxIdx = this.iField.length;

		// hPos直前(or＝)のiFieldを探す
		for( idx = maxIdx-1; idx >= 0; --idx ){
			if( this.iField[ idx ].hPosition < hPos ){
				break;
			}
			high = idx;
		}
		return high;
	},
	clone: function( pos, angle ){
		var newField = new fDWL.D4D.Field( this.gl, pos, angle, this.vertNum, this.difX, this.difZ ),
			idx = 0;
		
		newField.index    = this.index.concat();
		newField.baseVtx  = this.baseVtx.concat();
		newField.vertex   = this.vertex.concat();
		newField.normal   = this.normal.concat();
		newField.color    = this.color.concat();
		//newField.iField   = this.iField.concat();
		for( idx = 0; idx < this.iField.length; ++idx ){
			newField.iField.push(  this.iField[idx].clone() );
		}
		newField.vboList  = this.vboList.concat();
		newField.texCoord = this.texCoord.concat();
		newField.high	  = this.high;
		newField.low	  = this.low;
		newField.Ibo      = fDWL.WGL.createIbo( this.gl, this.index );
		
		return newField;
	}
};


//==================================================================
// ComplexObj
// 疑似 4D 複合 Object
//------------------------------------------------------------------
//	obj0: {};										// 3D Cube(4Dの1体)
//	cube: {};										// 3D Cube(4Dの1体)
//	hPosLow:										// H座標の表示下限
//	hPosHigh:										// H座標の表示上限
//==================================================================
fDWL.D4D.ComplexObj = function( gl, pos, rot, objs ){
	this.gl = gl;
	this.pos = pos;
	this.rotate = rot;
	this.objs = objs;
	for( var idx in this.objs ){
		if( this.hPosLow > objs[idx].getLow()  ){
			this.hPosLow = objs[idx].getLow();
		}
		if( objs[idx].getHigh() > this.hPosHigh ){
			this.hPosHigh = objs[idx].getHigh();
		}
	}
};

//------------------------------------------------------------------
// D4D 複合 Object Prototype
//------------------------------------------------------------------
fDWL.D4D.ComplexObj.prototype = {
	
	
	
	update: function( hPos ){
		for( var idx in this.objs ){
			// H座標位置は各オブジェクトごとに確認
			if( objs[idx].isDraw( hPos ) ){
				objs[idx].update( shader );
			}
		}
	},
	
	useProgram: function( shader, hPos ){
		for( var idx in this.objs ){
			// H座標位置は各オブジェクトごとに確認
			if( objs[idx].isDraw( hPos ) ){
				objs[idx].useProgram( shader );
			}
		}
	},
	
	draw: function( hPos ){
		for( var idx in this.objs ){
			// H座標位置は各オブジェクトごとに確認
			if( objs[idx].isDraw( hPos ) ){
				objs[idx].draw( hPos );
			}
		}
	},
	
	clone: function( pos, angle ){
		var newObj = {},
			objs = this.objs.concat();
		
		newObj = new fDWL.D4D.ComplexObj( this.gl, pos, angle, objs );
		return newObj;
	}
	
};

//==================================================================
// Cylinder4D
// 疑似 4D Cylinder Object
//------------------------------------------------------------------
//	obj0: {};										// 3D Cube(4Dの1体)
//	cube: {};										// 3D Cube(4Dの1体)
//	hPosLow:										// H座標の表示下限
//	hPosHigh:										// H座標の表示上限
//==================================================================
fDWL.D4D.Cylinder4D = function( gl, pos, rot, divNum, leng, rad, color, offs, rotate ){
	this.gl = gl;
	this.pos = pos;
	this.rotate = rot;
	this.scale = [ 1.0, 1.0, 1.0, 1.0 ];
	this.rad = rad;
	this.modelMatrix = mat4.identity(mat4.create());
	this.mvpMatrix = mat4.identity(mat4.create());
	this.invMatrix = mat4.identity(mat4.create());
	this.hPosLow = pos[3]-rad;
	this.hPosHigh = pos[3]+rad;
	this.data = fDWL.cylinder( divNum, leng, rad, color, offs, rotate );
	
	this.vboList = [
		fDWL.WGL.createVbo( gl, this.data.p ),
		fDWL.WGL.createVbo( gl, this.data.n ),
		fDWL.WGL.createVbo( gl, this.data.c ),
		fDWL.WGL.createVbo( gl, this.data.t )
	];
	this.ibo = fDWL.WGL.createIbo( gl, this.data.i );
};

//------------------------------------------------------------------
// D4D Cylinder Object Prototype
//------------------------------------------------------------------
fDWL.D4D.Cylinder4D.prototype = {
	
	getLow: function(){
		return this.hPosLow;
	},
	getHigh: function(){
		return this.hPosHigh;
	},
	isDraw: function( hPos ){
		return (( this.hPosLow <= hPos )&&( hPos < this.hPosHigh ));
	},
	
	getPos: function(){
		return this.pos;
	},
	
	getRotate: function(){
		return this.rotate;
	},
	
	getScale: function(){
		return [
			this.scale[0]*this.scale[3],
			this.scale[1],
			this.scale[2]*this.scale[3],
			this.scale[3]
		];
	},
	
	setTexVbo: function( texPos ){
		this.data.t = texPos;
		this.vboList[3] = fDWL.WGL.createVbo( this.gl, this.data.t );
	},
	
	// hPosに基づくscale計算
	calcScale: function( hPos ){
		var hLen = Math.abs( this.pos[3] - hPos );
		this.scale[3] = Math.sqrt( this.rad*this.rad - hLen*hLen )/this.rad;
	},
	
	update: function( hPos ){
		// hPosに基づくscale計算
		this.calcScale( hPos );
	},
	
	draw: function( shader, hPos, viewProjMtx, shaderParam ){
		var gl = this.gl;
		
		fDWL.WGL.makeMatrix(
				this.pos,
				this.rotate,
				this.getScale(),
				viewProjMtx,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.modelMatrix;
		shaderParam[1] = this.mvpMatrix;
		shaderParam[2] = this.invMatrix;
		shader.setProgram( shaderParam );
		
		// 引数として受け取った配列を処理する
		for( var idx in this.vboList ){
			gl.bindBuffer( gl.ARRAY_BUFFER, this.vboList[idx]);
			gl.enableVertexAttribArray( shader.attrLoc[idx]);
			gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0);
		}
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ibo );
		gl.drawElements( gl.TRIANGLE_STRIP, this.data.i.length, gl.UNSIGNED_SHORT, 0 );
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
	},
	
	drawShadow: function( shader, hPos, dvpMatrix ){
		var gl = this.gl,
			pos = [ this.pos[0], this.pos[1],-this.pos[2] ],
			rotate = [ this.rotate[0],  this.rotate[1], this.rotate[2] ],
			shaderParam = [];
		
		fDWL.WGL.makeMatrix(
				pos,
				rotate,
				this.getScale(),
				dvpMatrix,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.mvpMatrix;
		shader.setProgram( shaderParam );
		
		// 引数として受け取った配列を処理する
		for( var idx in this.vboList ){
			gl.bindBuffer( gl.ARRAY_BUFFER, this.vboList[idx]);
			gl.enableVertexAttribArray( shader.attrLoc[idx]);
			gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0);
		}
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ibo );
		gl.drawElements( gl.TRIANGLE_STRIP, this.data.i.length, gl.UNSIGNED_SHORT, 0 );
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
	}
	
};

//==================================================================
// Corn4D
// 疑似 4D Corn Object
//------------------------------------------------------------------
// 注意：あくまで疑似に過ぎない。途中の表示はドーム状になるべきで、
//		 それだけプリミティブを使用しなければならない。
//------------------------------------------------------------------
//	hPosLow:	H座標の表示下限
//	hPosHigh:	H座標の表示上限
//	normalDir:	上方、1.0:通常, (-1.0):うつ伏せ
//==================================================================
fDWL.D4D.Corn4D = function( gl, pos, rot, divNum, leng, rad, color, normalDir, offs, rotate ){
	this.gl = gl;
	this.pos = pos;
	this.rotate = rot;
	this.rad = rad;
	this.scale = [ 1.0, 1.0, 1.0, 1.0 ];
	this.scaleY = 1.0;
	this.scaleXZ = 1.0;
	this.modelMatrix = mat4.identity(mat4.create());
	this.mvpMatrix = mat4.identity(mat4.create());
	this.invMatrix = mat4.identity(mat4.create());
	
	this.hPosLow = pos[3]-rad;
	this.hPosHigh = pos[3]+rad;
	this.data = fDWL.corn( divNum, leng, rad, color, normalDir, offs, rotate );
	
	this.vboList = [
		fDWL.WGL.createVbo( gl, this.data.p ),
		fDWL.WGL.createVbo( gl, this.data.n ),
		fDWL.WGL.createVbo( gl, this.data.c ),
		fDWL.WGL.createVbo( gl, this.data.t )
	];
	this.ibo = fDWL.WGL.createIbo( gl, this.data.i );
};

//------------------------------------------------------------------
// D4D Corn Object Prototype
//------------------------------------------------------------------
fDWL.D4D.Corn4D.prototype = {
	
	getLow: function(){
		return this.hPosLow;
	},
	getHigh: function(){
		return this.hPosHigh;
	},
	isDraw: function( hPos ){
		return (( this.hPosLow <= hPos )&&( hPos < this.hPosHigh ));
	},
	
	getPos: function(){
		return this.pos;
	},
	
	getRotate: function(){
		return this.rotate;
	},
	
	setTexVbo: function( texPos ){
		this.data.t = texPos;
		this.vboList[3] = fDWL.WGL.createVbo( this.gl, this.data.t );
	},
	
	getScale: function(){
		return [
			this.scale[0]*this.scaleXZ,
			this.scale[1]*this.scaleY,
			this.scale[2]*this.scaleXZ,
			this.scale[3]
		];
	},
	
	update: function( hPos ){
		if( this.isDraw( hPos ) === false ){
			return;
		}
		// hPosに基づくscale計算
		var hLen = Math.abs( this.pos[3] - hPos );
		this.scaleY = ( this.rad - hLen )/this.rad;
		this.scaleXZ = Math.sqrt( this.rad*this.rad - hLen*hLen )/this.rad;
		this.scale[3] = this.scaleY;
	},
	
	draw: function( shader, hPos, viewProjMtx, shaderParam ){
		if( this.isDraw( hPos ) === false ){
			return;
		}
		var gl = this.gl;
		
		fDWL.WGL.makeMatrix(
				this.pos,
				this.rotate,
				this.getScale(),
				viewProjMtx,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.modelMatrix;
		shaderParam[1] = this.mvpMatrix;
		shaderParam[2] = this.invMatrix;
		shader.setProgram( shaderParam );
		
		// 引数として受け取った配列を処理する
		for( var idx in this.vboList ){
			gl.bindBuffer( gl.ARRAY_BUFFER, this.vboList[idx]);
			gl.enableVertexAttribArray( shader.attrLoc[idx]);
			gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0);
		}
		// Draw
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ibo );
		gl.drawElements( gl.TRIANGLE_FAN, this.data.i.length, gl.UNSIGNED_SHORT, 0 );
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
	}
};




//==================================================================
//	NameSpace:	fDWL.WGL
//==================================================================
fDWL.namespace( 'fDWL.WGL' );

//------------------------------------------------------------------
// textureの作成
//------------------------------------------------------------------
fDWL.WGL.createTexture = function( gl, source ){
	// テクスチャオブジェクトの生成
	var tex = gl.createTexture();
	var img = new Image();

	// データのオンロードをトリガーに
	img.onload = function(){ ( fDWL.WGL.handleTextureLoaded( gl, img, tex ) ); }
	// イメージオブジェクトのソースを指定
	img.src = source;

	return tex;
}

fDWL.WGL.handleTextureLoaded = function( gl, img, tex ){
	// テクスチャへイメージを適用
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

//------------------------------------------------------------------
// Create VBO
//------------------------------------------------------------------
fDWL.WGL.createVbo = function( gl, data ){
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return vbo;
}


//------------------------------------------------------------------
// Create IBO
//------------------------------------------------------------------
fDWL.WGL.createIbo = function( gl, data ){
	var ibo = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	return ibo;
}


//------------------------------------------------------------------
// 座標変換行列計算
//------------------------------------------------------------------
fDWL.WGL.makeMatrix = function( pos, rot, scale, viewProjMtx, modelMtx, mvpMtx, invMtx ){
	
	mat4.identity( modelMtx );
	// 回転
	mat4.rotateY( modelMtx, rot[1], modelMtx );
	mat4.rotateZ( modelMtx, rot[2], modelMtx );
	mat4.rotateX( modelMtx, rot[0], modelMtx );
	// スケール
	mat4.scale( modelMtx, [ scale[0], scale[1], scale[2] ], modelMtx );
	// 平行移動
	modelMtx[12] = pos[0], modelMtx[13] = pos[1], modelMtx[14] = pos[2];
	// 視点変換
	mat4.multiply( viewProjMtx, modelMtx, mvpMtx );
	// 逆行列
	mat4.inverse( modelMtx, invMtx );
}

//------------------------------------------------------------------
// 外積を計算
//------------------------------------------------------------------
fDWL.outProd = function( vec0, vec1 ){
	return [
		vec0[1]*vec1[2] - vec0[2]*vec1[1],
		vec0[2]*vec1[0] - vec0[0]*vec1[2],
		vec0[0]*vec1[1] - vec0[1]*vec1[0]
	];
}

//------------------------------------------------------------------
// 3Dベクトルの正規化
//------------------------------------------------------------------
fDWL.normalize3 = function( vec ){
	var vSize = Math.sqrt( vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2] );
	if( vSize == 0 ){
		return [ 0, 0, 0 ];
	}else{
		return [ vec[0]/vSize, vec[1]/vSize, vec[2]/vSize ];
	}
}


//------------------------------------------------------------------
// 3Dベクトルの線形補間
//------------------------------------------------------------------
fDWL.lerp3 = function( v0, v1, rate ){
	return [
		v0[0] + rate*( v1[0] - v0[0] ),
		v0[1] + rate*( v1[1] - v0[1] ),
		v0[2] + rate*( v1[2] - v0[2] )
	];
};

//------------------------------------------------------------------
// 線形補間
//------------------------------------------------------------------
fDWL.lerp1 = function( a, b, rate ){
	return ( a + rate*( b - a ));
};

//------------------------------------------------------------------
// 線形補間比率を算出
//------------------------------------------------------------------
fDWL.getLerpRate = function( pos, low, high ){
	if( low === high ){
		if( 0 === low ){
			high = 1;
		}else{
			low = high-1;
		}
	}
	return ( (pos-low)/(high-low) );
};


//------------------------------------------------------------------
// 環境用キューブを生成
//------------------------------------------------------------------
fDWL.EnvCube = function( gl, side, color ){
	this.data		= fDWL.cube( [ 0.0, 0.0, 0.0 ], side, [ 1, 1, 1 ], color, true );
	this.position	= fDWL.WGL.createVbo( gl, this.data.p );
	this.normal		= fDWL.WGL.createVbo( gl, this.data.n );
	this.color		= fDWL.WGL.createVbo( gl, this.data.c );
	this.vboList	= [ this.position, this.normal, this.color ];
	this.ibo		= fDWL.WGL.createIbo( gl, this.data.i );
	this.gl			= gl;
};

fDWL.EnvCube.prototype = {
	useProgram: function( shader ){
		var gl = this.gl;
		gl.useProgram( shader.prg );
		// 引数として受け取った配列を処理する
		for( var idx in this.vboList ){
			gl.bindBuffer( gl.ARRAY_BUFFER, this.vboList[idx]);
			gl.enableVertexAttribArray( shader.attrLoc[idx]);
			gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0 );
		}
	},
	draw: function(){
		var gl = this.gl;
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ibo );
		gl.drawElements( gl.TRIANGLES, this.data.i.length, gl.UNSIGNED_SHORT, 0 );
	}
	
};


//==================================================================
// Obj3D
// 3D Cylinder Object
//------------------------------------------------------------------
//	data:	  データの配列
//	dataType: データの型の配列( gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN )
//==================================================================
fDWL.Objs3D = function( gl, pos, rot, scale, data, dataType ){
	this.gl = gl;
	this.pos = pos;
	this.rotate = rot;
	this.scale = scale;
	this.modelMatrix = mat4.identity(mat4.create());
	this.mvpMatrix = mat4.identity(mat4.create());
	this.invMatrix = mat4.identity(mat4.create());
	this.data = data;
	this.dataType = dataType;
	
	for( var idx in dataType ){
		this.data[idx].vboList = [
			fDWL.WGL.createVbo( gl, this.data[idx].p ),
			fDWL.WGL.createVbo( gl, this.data[idx].n ),
			fDWL.WGL.createVbo( gl, this.data[idx].c ),
			fDWL.WGL.createVbo( gl, this.data[idx].t )
		];
		this.data[idx].ibo = fDWL.WGL.createIbo( gl, this.data[idx].i );
	}
};

fDWL.Objs3D.prototype = {
	isDraw: function(){
		return true;
	},
	
	getPos: function(){
		return this.pos;
	},
	setPos: function( pos ){
		this.pos = pos;
	},
	
	getRotate: function(){
		return this.rotate;
	},
	setRotate: function( rotate ){
		this.rotate = rotate;
	},
	
	getScale: function(){
		return this.scale;
	},
	
	prepDraw: function( shader, viewProjMtx, shaderParam ){
		
		fDWL.WGL.makeMatrix(
				this.pos,
				this.rotate,
				this.scale,
				viewProjMtx,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.modelMatrix;
		shaderParam[1] = this.mvpMatrix;
		shaderParam[2] = this.invMatrix;
		shader.setProgram( shaderParam );
	},
	
	draw: function( shader ){
		var idx = 0,
			objIdx = 0,
			vboList = [],
			gl = this.gl;
		
		// 各配列を描画処理
		for( objIdx in this.dataType ){
			vboList = this.data[objIdx].vboList;
			
			for( idx in vboList ){
				gl.bindBuffer( gl.ARRAY_BUFFER, vboList[idx]);
				gl.enableVertexAttribArray( shader.attrLoc[idx]);
				gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0);
			}
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.data[objIdx].ibo );
			gl.drawElements( this.dataType[objIdx], this.data[objIdx].i.length, gl.UNSIGNED_SHORT, 0 );
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
		}
	},
	
	drawShadow: function( shader, dvpMatrix ){
		var gl = this.gl,
			pos = [ this.pos[0], this.pos[1], -this.pos[2] ],
			rotate = [ this.rotate[0], -this.rotate[1], this.rotate[2] ],
			shaderParam = [];
		
		fDWL.WGL.makeMatrix(
				pos,
				rotate,
				this.getScale(),
				dvpMatrix,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.mvpMatrix;
		shader.setProgram( shaderParam );
		
		// 各配列を描画処理
		for( objIdx in this.dataType ){
			vboList = this.data[objIdx].vboList;
			
			gl.bindBuffer( gl.ARRAY_BUFFER, vboList[0]);
			gl.enableVertexAttribArray( shader.attrLoc[0]);
			gl.vertexAttribPointer( shader.attrLoc[0], shader.attrStride[0], gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.data[objIdx].ibo );
			gl.drawElements( this.dataType[objIdx], this.data[objIdx].i.length, gl.UNSIGNED_SHORT, 0 );
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
		}
	}
};


//------------------------------------------------------------------
// TiledFloor を生成
//------------------------------------------------------------------
fDWL.tiledFloor = function( tileLength, tileNum, color0, color1 ){
	var unitNum = tileNum * tileNum;
	var tlg = tileLength*0.5;
	var unitPos = [
		-tlg, 0, -tlg,
		-tlg, 0,  tlg,
		 tlg, 0,  tlg,
		 tlg, 0, -tlg
	];
	var unitNor = [ 0.0, 1.0, 0.0 ];
	var pos = new Array();
	var nor = new Array();
	var col = new Array();
	var idx = new Array();
	var offsX = -tlg*(tileNum-1);
	var offsZ = offsX;
	var tlNo = 0;
	var st = new Array();
	// 黒のプレート
	var offsX = tlg*(tileNum-1);
	var offsZ = offsX;
	for( var clmn = 0; clmn < tileNum; clmn++ ){
		offsX = tlg*(tileNum-1)
		for( var row = 0; row < tileNum; row++ ){
			if( (row+clmn) & 0x01 ){
				offsX -= tileLength;
				continue;
			}
			for( var ii = 0; ii < unitPos.length; ii+=3 ){
				pos.push( unitPos[ii]+offsX, unitPos[ii+1], unitPos[ii+2]+offsZ );
				nor.push( unitNor[0], unitNor[1], unitNor[2] );
				col.push( color0[0],  color0[1],  color0[2],  color0[3] );
			}
			idx.push( tlNo, tlNo+1, tlNo+2, tlNo, tlNo+2, tlNo+3 );
			st.push( 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 );
			offsX -= tileLength;
			tlNo += 4;
		}
		offsZ -= tileLength;
	}
	// 白のプレート
	offsZ = tlg*(tileNum-1);
	for( var clmn = 0; clmn < tileNum; clmn++ ){
		offsX = tlg*(tileNum-1)
		for( var row = 0; row < tileNum; row++ ){
			if( ((row+clmn) & 0x01) == 0 ){
				offsX -= tileLength;
				continue;
			}
			for( var ii = 0; ii < unitPos.length; ii+=3 ){
				pos.push( unitPos[ii]+offsX, unitPos[ii+1], unitPos[ii+2]+offsZ );
				nor.push( unitNor[0], unitNor[1], unitNor[2] );
				col.push( color1[0],  color1[1],  color1[2],  color1[3] );
			}
			idx.push( tlNo, tlNo+1, tlNo+2, tlNo, tlNo+2, tlNo+3 );
			st.push( 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 );
			offsX -= tileLength;
			tlNo += 4;
		}
		offsZ -= tileLength;
	}
	return { p : pos, n : nor, c : col, t : st, i : idx };
};

//------------------------------------------------------------------
// Cube を生成
//------------------------------------------------------------------
fDWL.cube = function( posOffs, side, scale, color, isTex ){
	var hs = side * 0.5;
	var pos = [
		-hs, -hs,  hs,  hs, -hs,  hs,  hs,  hs,  hs, -hs,  hs,  hs,
		-hs, -hs, -hs, -hs,  hs, -hs,  hs,  hs, -hs,  hs, -hs, -hs,
		-hs,  hs, -hs, -hs,  hs,  hs,  hs,  hs,  hs,  hs,  hs, -hs,
		-hs, -hs, -hs,  hs, -hs, -hs,  hs, -hs,  hs, -hs, -hs,  hs,
		 hs, -hs, -hs,  hs,  hs, -hs,  hs,  hs,  hs,  hs, -hs,  hs,
		-hs, -hs, -hs, -hs, -hs,  hs, -hs,  hs,  hs, -hs,  hs, -hs
	];
	for( var ii = 0; ii < pos.length; ii += 3 ){
		pos[ii  ] = pos[ii  ]*scale[0] + posOffs[0];
		pos[ii+1] = pos[ii+1]*scale[1] + posOffs[1];
		pos[ii+2] = pos[ii+2]*scale[2] + posOffs[2];
	}
	var nor = new Array();
	if( isTex == false ){
		nor = [
			0.0, 0.0,  1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
			0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,
			0.0, 1.0,  0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
			0.0, -1.0,  0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,
			1.0, 0.0,  0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
			-1.0, 0.0,  0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0
		];
	}else{
		nor = [
			-1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
			-1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,
			-1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,
			-1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
			 1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,
			-1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0
		];
	}

	var col = new Array();
	for(var i = 0; i < pos.length / 3; i++){
		if(color){
			var tc = color;
		}else{
			tc = hsva(360 / pos.length / 3 * i, 1, 1, 1);
		}
		col.push(tc[0], tc[1], tc[2], tc[3]);
	}
	var st = [
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
	];
	var idx = [
		 0,  1,  2,  0,  2,  3,
		 4,  5,  6,  4,  6,  7,
		 8,  9, 10,  8, 10, 11,
		12, 13, 14, 12, 14, 15,
		16, 17, 18, 16, 18, 19,
		20, 21, 22, 20, 22, 23
	];
	return {p : pos, n : nor, c : col, t : st, i : idx};
};


//------------------------------------------------------------------
// Sphere を生成
//------------------------------------------------------------------
fDWL.sphere = function(row, column, rad, color){
	var pos = new Array(), nor = new Array(),
	    col = new Array(), st  = new Array(), idx = new Array();
	for(var i = 0; i <= row; i++){
		var r = Math.PI / row * i;
		var ry = Math.cos(r);
		var rr = Math.sin(r);
		for(var ii = 0; ii <= column; ii++){
			var tr = Math.PI * 2 / column * ii;
			var tx = rr * rad * Math.cos(tr);
			var ty = ry * rad;
			var tz = rr * rad * Math.sin(tr);
			var rx = rr * Math.cos(tr);
			var rz = rr * Math.sin(tr);
			if(color){
				var tc = color;
			}else{
				tc = hsva(360 / row * i, 1, 1, 1);
			}
			pos.push(tx, ty, tz);
			nor.push(rx, ry, rz);
			col.push(tc[0], tc[1], tc[2], tc[3]);
			st.push(1 - 1 / column * ii, 1 / row * i);
		}
	}
	r = 0;
	for(i = 0; i < row; i++){
		for(ii = 0; ii < column; ii++){
			r = (column + 1) * i + ii;
			idx.push(r, r + 1, r + column + 2);
			idx.push(r, r + column + 2, r + column + 1);
		}
	}
	return {p : pos, n : nor, c : col, t : st, i : idx};
};


//------------------------------------------------------------------
// Torus を生成
//------------------------------------------------------------------
fDWL.torus = function( row, column, irad, orad, color ){
	var pos = new Array(), nor = new Array(),
	    col = new Array(), st  = new Array(), idx = new Array();
	for(var i = 0; i <= row; i++){
		var r = Math.PI * 2 / row * i;
		var rr = Math.cos(r);
		var ry = Math.sin(r);
		for(var ii = 0; ii <= column; ii++){
			var tr = Math.PI * 2 / column * ii;
			var tx = (rr * irad + orad) * Math.cos(tr);
			var ty = ry * irad;
			var tz = (rr * irad + orad) * Math.sin(tr);
			var rx = rr * Math.cos(tr);
			var rz = rr * Math.sin(tr);
			if(color){
				var tc = color;
			}else{
				tc = hsva(360 / column * ii, 1, 1, 1);
			}
			var rs = 1 / column * ii;
			var rt = 1 / row * i + 0.5;
			if(rt > 1.0){rt -= 1.0;}
			rt = 1.0 - rt;
			pos.push(tx, ty, tz);
			nor.push(rx, ry, rz);
			col.push(tc[0], tc[1], tc[2], tc[3]);
			st.push(rs, rt);
		}
	}
	for(i = 0; i < row; i++){
		for(ii = 0; ii < column; ii++){
			r = (column + 1) * i + ii;
			idx.push(r, r + column + 1, r + 1);
			idx.push(r + column + 1, r + column + 2, r + 1);
		}
	}
	return {p : pos, n : nor, c : col, t : st, i : idx};
};


//------------------------------------------------------------------
// Cylinder を生成
//------------------------------------------------------------------
fDWL.cylinder = function( divNum, leng, rad, color, offs, rotate ){
	var pos = new Array(),
		nor = new Array(),
		col = new Array(),
		st  = new Array(),
		idx = new Array(),
		ang = 0,
		x = 0,
		z = 0,
		px = 0,
		pz = 0,
		rs = 0,
		posV = [],
		norV = [],
		modelMtx = mat4.identity(mat4.create());
	
	mat4.rotateX( modelMtx, rotate[0], modelMtx );
	mat4.rotateZ( modelMtx, rotate[2], modelMtx );
	mat4.rotateY( modelMtx, rotate[1], modelMtx );
	
	for(var ii = 0; ii <= divNum; ii++){
		ang = Math.PI * 2 / divNum * ii;
		x = Math.cos(ang),
		z = Math.sin(ang);
		px = x*rad+offs[0],
		pz = z*rad+offs[2];
		rs = ii/divNum;
		
		mat4.multiplyVec4( modelMtx, [ px, offs[1]-(leng/2), pz, 0 ], posV );
		pos.push( posV[0], posV[1], posV[2] );
		mat4.multiplyVec4( modelMtx, [ x, 0, z, 0 ], norV );
		nor.push( norV[0], norV[1], norV[2] );

		col.push( color[0], color[1], color[2], color[3] );
		st.push( rs, 1.0 );
		idx.push( ii*2 );
		
		mat4.multiplyVec4( modelMtx, [ px, offs[1]+(leng/2), pz, 0 ], posV );
		pos.push( posV[0], posV[1], posV[2] );
		nor.push( norV[0], norV[1], norV[2] );

		col.push( color[0], color[1], color[2], color[3] );
		st.push( rs, 0.0 );
		idx.push( ii*2+1 );		//gl.TRIANGLE_STRIPを使用
	}
	return { p : pos, n : nor, c : col, t : st, i : idx };
};


//------------------------------------------------------------------
// Corn を生成
//	divNum		円の分割数
//	leng		円錐高さ
//	offs		中心座標(円の中心)
//	rad			半径
//	color		色
//	normalDir	上方方向、1.0:通常、うつ伏せ:(-1.0)
//------------------------------------------------------------------
fDWL.corn = function( divNum, leng, rad, color, normalDir, offs, rotate ){
	var pos = new Array(),
		nor = new Array(),
		col = new Array(),
		st  = new Array(),
		idx = new Array(),
		ang = 0,
		x = 0,
		z = 0,
		rx = 0,
		ry = 0,
		rz = 0,
		slope = 0,
		rs = 0,
		rt = 0,
		posV = [],
		norV = [],
		modelMtx = mat4.identity(mat4.create());
	
	mat4.rotateX( modelMtx, rotate[0], modelMtx );
	mat4.rotateZ( modelMtx, rotate[2], modelMtx );
	mat4.rotateY( modelMtx, rotate[1], modelMtx );
	
	slope = Math.sqrt( rad*rad + leng*leng );
	ry = normalDir*rad/slope;
	slope = leng/slope;
	
	// 頂点部分
	mat4.multiplyVec4( modelMtx, [ offs[0], offs[1]+leng, offs[2], 0 ], posV );
	pos.push( posV[0], posV[1], posV[2] );
	mat4.multiplyVec4( modelMtx, [ 0, normalDir, 0, 0 ], norV );
	nor.push( norV[0], norV[1], norV[2] );
	
	col.push( color[0], color[1], color[2], color[3] );
	st.push( 0.5, 0.5 );
	idx.push( 0 );		//gl.TRIANGLE_FANを使用
	
	for(var ii = 0; ii < divNum; ii++){
		ang = Math.PI * 2 / divNum * ii;
		x = Math.cos(-ang),
		z = Math.sin(-ang);
		
		rx = x*slope*normalDir;
		rz = z*slope*normalDir;
		rs = 0.5-(x/2);
		rt = 0.5-(z/2);
		
		mat4.multiplyVec4( modelMtx, [ x*rad+offs[0], offs[1], z*rad+offs[2], 0 ], posV );
		pos.push( posV[0], posV[1], posV[2] );
		mat4.multiplyVec4( modelMtx, [ rx, ry, rz, 0 ], norV );
		nor.push( norV[0], norV[1], norV[2] );
		col.push( color[0], color[1], color[2], color[3] );
		st.push( rs, rt );
		idx.push( ii+1 );		//gl.TRIANGLE_FANを使用
	}
	
	// 円周部分終点＝始点
	pos.push( pos[3], pos[4], pos[5] );
	nor.push( nor[3], nor[4], nor[5] );
	col.push( color[0], color[1], color[2], color[3] );
	st.push( 0.0, 0.5 );
	idx.push( divNum+1 );		//gl.TRIANGLE_FANを使用
	
	return { p : pos, n : nor, c : col, t : st, i : idx };
};


//------------------------------------------------------------------
// Rectの集合を生成
//	vertice		rectの4頂点の配列 [ x,y,z, x,y,z, x,y,z, x,y,z ], [ x,y,z, ... ], ...
//	offs		中心座標
//	color		色
//------------------------------------------------------------------
fDWL.rects = function( vertice, normal, color, tex, offs, rotate ){
	var pos = new Array(),
		nor = new Array(),
		col = new Array(),
		st  = new Array(),
		idx = new Array(),
		ii = 0,
		jj = 0,
		subIdx = 0,
		vertex = [],
		posV = [],
		norV = [],
		modelMtx = mat4.identity(mat4.create());
	
	mat4.rotateX( modelMtx, rotate[0], modelMtx );
	mat4.rotateZ( modelMtx, rotate[2], modelMtx );
	mat4.rotateY( modelMtx, rotate[1], modelMtx );
	
	for( ii = 0; ii < vertice.length; ii++ ){
		
		mat4.multiplyVec4( modelMtx, [ normal[ii][0], normal[ii][1], normal[ii][2], 0 ], norV );
		vertex = vertice[ii];
		
		for( jj = 0; jj < 3*4; jj += 3 ){
			mat4.multiplyVec4( modelMtx, [ vertex[jj]+offs[0], vertex[jj+1]+offs[1], vertex[jj+2]+offs[2], 0 ], posV );
			pos.push( posV[0], posV[1], posV[2] );
			nor.push( norV[0], norV[1], norV[2] );
			col.push( color[0], color[1], color[2], color[3] );
		}
		
		subIdx = ii*4;
		idx.push( subIdx, subIdx+1, subIdx+2, subIdx, subIdx+2, subIdx+3 );
	}
	for( ii = 0; ii < tex.length; ii += 2 ){
		st.push( tex[ii], tex[ii+1] );
	}
	
	return { p : pos, n : nor, c : col, t : st, i : idx };
};


//------------------------------------------------------------------
// 当たり判定：線とSphere
// rayVecは正規化されている必要がある
//------------------------------------------------------------------
fDWL.isCollisionSphere = function( rayPos, rayVec, centerPos, radius ){
	var m = [ rayPos[0]-centerPos[0], rayPos[1]-centerPos[1], rayPos[2] - centerPos[2] ];
	var c = vec3.dot( m, m ) - radius * radius;
	if( c <= 0.0 ){
		return true;
	}
	var b = vec3.dot( m, rayVec );
	if( b > 0.0 ){
		return false;
	}
	var det = b*b - c;
	if( det < 0.0 ){
		return false;
	}
	return true;
};


//------------------------------------------------------------------
// 当たり判定：線とPolyhedron(Cube)
//------------------------------------------------------------------
fDWL.isCollisionPolyhedrom = function( linePosA, linePosB, planePoses, planeNorms, planeNum ){
	var vecD = [ linePosB[0]-linePosA[0], linePosB[1]-linePosA[1], linePosB[2]-linePosA[2] ];
	var tFirst = 0.0;
	var tLast = 1.0;
	for( var cnt = 0; cnt < planeNum; ++cnt ){
		var denom = vec3.dot( planeNorms[cnt], vecD );
		var dist = vec3.dot( planePoses[cnt], planeNorms[cnt] ) - vec3.dot( planeNorms[cnt], linePosA );

		if( denom == 0.0 ){
			if(dist > 0.0 ){
				return false;
			}
		}else{
			var t = dist / denom;
			if( denom < 0.0 ){
				if( t > tFirst ){
					tFirst = t;
				}
			}else{
				if( tLast > t ){
					tLast = t;
				}
			}
			if( tFirst > tLast ){
				return false;
			}
		}
	}
	return true;
}


//------------------------------------------------------------------
//  ブラウザ名を取得
//
//  @return     ブラウザ名(ie6、ie7、ie8、ie9、ie10、ie11、chrome、safari、opera、firefox、unknown)
//
//------------------------------------------------------------------
fDWL.getBrowserName = function(){
    var ua = window.navigator.userAgent.toLowerCase();
    var ver = window.navigator.appVersion.toLowerCase();
    var name = 'unknown';

    if (ua.indexOf("msie") != -1){
        if (ver.indexOf("msie 6.") != -1){
            name = 'ie6';
        }else if (ver.indexOf("msie 7.") != -1){
            name = 'ie7';
        }else if (ver.indexOf("msie 8.") != -1){
            name = 'ie8';
        }else if (ver.indexOf("msie 9.") != -1){
            name = 'ie9';
        }else if (ver.indexOf("msie 10.") != -1){
            name = 'ie10';
        }else{
            name = 'ie';
        }
    }else if(ua.indexOf('trident/7') != -1){
        name = 'ie11';
    }else if (ua.indexOf('chrome') != -1){
        name = 'chrome';
    }else if (ua.indexOf('safari') != -1){
        name = 'safari';
    }else if (ua.indexOf('opera') != -1){
        name = 'opera';
    }else if (ua.indexOf('firefox') != -1){
        name = 'firefox';
    }
    return name;
};

//------------------------------------------------------------------
//------------------------------------------------------------------
