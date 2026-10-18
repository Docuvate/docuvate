//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_extraction_image_dto.g.dart';

/// DocumentExtractionImageDto
///
/// Properties:
/// * [id] 
/// * [page] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [kind] 
/// * [caption] 
@BuiltValue()
abstract class DocumentExtractionImageDto implements Built<DocumentExtractionImageDto, DocumentExtractionImageDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'x')
  num get x;

  @BuiltValueField(wireName: r'y')
  num get y;

  @BuiltValueField(wireName: r'width')
  num get width;

  @BuiltValueField(wireName: r'height')
  num get height;

  @BuiltValueField(wireName: r'kind')
  DocumentExtractionImageDtoKindEnum get kind;
  // enum kindEnum {  embedded,  figure,  };

  @BuiltValueField(wireName: r'caption')
  String? get caption;

  DocumentExtractionImageDto._();

  factory DocumentExtractionImageDto([void updates(DocumentExtractionImageDtoBuilder b)]) = _$DocumentExtractionImageDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentExtractionImageDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentExtractionImageDto> get serializer => _$DocumentExtractionImageDtoSerializer();
}

class _$DocumentExtractionImageDtoSerializer implements PrimitiveSerializer<DocumentExtractionImageDto> {
  @override
  final Iterable<Type> types = const [DocumentExtractionImageDto, _$DocumentExtractionImageDto];

  @override
  final String wireName = r'DocumentExtractionImageDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentExtractionImageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
    );
    yield r'x';
    yield serializers.serialize(
      object.x,
      specifiedType: const FullType(num),
    );
    yield r'y';
    yield serializers.serialize(
      object.y,
      specifiedType: const FullType(num),
    );
    yield r'width';
    yield serializers.serialize(
      object.width,
      specifiedType: const FullType(num),
    );
    yield r'height';
    yield serializers.serialize(
      object.height,
      specifiedType: const FullType(num),
    );
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(DocumentExtractionImageDtoKindEnum),
    );
    if (object.caption != null) {
      yield r'caption';
      yield serializers.serialize(
        object.caption,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentExtractionImageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentExtractionImageDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'x':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x = valueDes;
          break;
        case r'y':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y = valueDes;
          break;
        case r'width':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.width = valueDes;
          break;
        case r'height':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.height = valueDes;
          break;
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentExtractionImageDtoKindEnum),
          ) as DocumentExtractionImageDtoKindEnum;
          result.kind = valueDes;
          break;
        case r'caption':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.caption = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentExtractionImageDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentExtractionImageDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class DocumentExtractionImageDtoKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'embedded')
  static const DocumentExtractionImageDtoKindEnum embedded = _$documentExtractionImageDtoKindEnum_embedded;
  @BuiltValueEnumConst(wireName: r'figure')
  static const DocumentExtractionImageDtoKindEnum figure = _$documentExtractionImageDtoKindEnum_figure;

  static Serializer<DocumentExtractionImageDtoKindEnum> get serializer => _$documentExtractionImageDtoKindEnumSerializer;

  const DocumentExtractionImageDtoKindEnum._(String name): super(name);

  static BuiltSet<DocumentExtractionImageDtoKindEnum> get values => _$documentExtractionImageDtoKindEnumValues;
  static DocumentExtractionImageDtoKindEnum valueOf(String name) => _$documentExtractionImageDtoKindEnumValueOf(name);
}

