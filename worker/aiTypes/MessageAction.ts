type LanguagesSupported = 'af' | 'am' | 'ar' | 'ast' | 'az' | 'ba' | 'be' | 'bg' | 'bn' | 'br' | 'bs' | 'ca' | 'ceb' | 'cs' | 'cy' | 'da' | 'de' | 'el' | 'en' | 'es' | 'et' | 'fa' | 'ff' | 'fi' | 'fr' | 'fy' | 'ga' | 'gd' | 'gl' | 'gu' | 'ha' | 'he' | 'hi' | 'hr' | 'ht' | 'hu' | 'hy' | 'id' | 'ig' | 'ilo' | 'is' | 'it' | 'ja' | 'jv' | 'ka' | 'kk' | 'km' | 'kn' | 'ko' | 'lb' | 'lg' | 'ln' | 'lo' | 'lt' | 'lv' | 'mg' | 'mk' | 'ml' | 'mn' | 'mr' | 'ms' | 'my' | 'ne' | 'nl' | 'no' | 'ns' | 'oc' | 'or' | 'pa' | 'pl' | 'ps' | 'pt' | 'ro' | 'ru' | 'sd' | 'si' | 'sk' | 'sl' | 'so' | 'sq' | 'sr' | 'ss' | 'su' | 'sv' | 'sw' | 'ta' | 'th' | 'tl' | 'tn' | 'tr' | 'uk' | 'ur' | 'uz' | 'vi' | 'wo' | 'xh' | 'yi' | 'yo' | 'zh' | 'zu';

export interface MessageAction {
	translation: {
		source: LanguagesSupported;
		target: LanguagesSupported;
	} | null;
	previousMessageSearch: string[] | null;
	webSearch: string[] | null;
	imageGenerate: string | null;
}
