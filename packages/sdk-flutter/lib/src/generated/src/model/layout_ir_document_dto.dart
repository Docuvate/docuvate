//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/layout_ir_page_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_document_dto.g.dart';

/// LayoutIrDocumentDto
///
/// Properties:
/// * [version] 
/// * [pages] 
@BuiltValue()
abstract class LayoutIrDocumentDto implements Built<LayoutIrDocumentDto, LayoutIrDocumentDtoBuilder> {
  @BuiltValueField(wireName: r'version')
  LayoutIrDocumentDtoVersionEnum get version;
  // enum versionEnum {  1,  };

  @BuiltValueField(wireName: r'pages')
  BuiltList<LayoutIrPageDto> get pages;

  LayoutIrDocumentDto._();

  factory LayoutIrDocumentDto([void updates(LayoutIrDocumentDtoBuilder b)]) = _$LayoutIrDocumentDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrDocumentDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrDocumentDto> get serializer => _$LayoutIrDocumentDtoSerializer();
}

class _$LayoutIrDocumentDtoSerializer implements PrimitiveSerializer<LayoutIrDocumentDto> {
  @override
  final Iterable<Type> types = const [LayoutIrDocumentDto, _$LayoutIrDocumentDto];

  @override
  final String wireName = r'LayoutIrDocumentDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrDocumentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'version';
    yield serializers.serialize(
      object.version,
      specifiedType: const FullType(LayoutIrDocumentDtoVersionEnum),
    );
    yield r'pages';
    yield serializers.serialize(
      object.pages,
      specifiedType: const FullType(BuiltList, [FullType(LayoutIrPageDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrDocumentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrDocumentDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'version':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LayoutIrDocumentDtoVersionEnum),
          ) as LayoutIrDocumentDtoVersionEnum;
          result.version = valueDes;
          break;
        case r'pages':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutIrPageDto)]),
          ) as BuiltList<LayoutIrPageDto>;
          result.pages.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrDocumentDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrDocumentDtoBuilder();
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

class LayoutIrDocumentDtoVersionEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'1')
  static const LayoutIrDocumentDtoVersionEnum n1 = _$layoutIrDocumentDtoVersionEnum_n1;

  static Serializer<LayoutIrDocumentDtoVersionEnum> get serializer => _$layoutIrDocumentDtoVersionEnumSerializer;

  const LayoutIrDocumentDtoVersionEnum._(String name): super(name);

  static BuiltSet<LayoutIrDocumentDtoVersionEnum> get values => _$layoutIrDocumentDtoVersionEnumValues;
  static LayoutIrDocumentDtoVersionEnum valueOf(String name) => _$layoutIrDocumentDtoVersionEnumValueOf(name);
}

